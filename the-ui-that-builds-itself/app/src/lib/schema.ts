import { jsonSchema, parsePartialJson } from "ai";

import { getActionNames } from "@/lib/capabilities";
import { getDesignSystemComponentTypes } from "@/lib/catalog";
import type {
  BasicUiCommand,
  BasicUiFlatNode,
  BasicUiNode,
  BasicUiUpdateCommand,
} from "@/lib/ui";

const htmlElementTypes = [
  "main",
  "section",
  "article",
  "header",
  "footer",
  "div",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "p",
  "span",
  "strong",
  "em",
  "small",
  "a",
  "img",
  "label",
  "input",
  "select",
  "textarea",
  "button",
  "option",
] as const;

const formElementTypes = ["Form"] as const;

type ModelProp = {
  name: string;
  value: ModelValue;
};

type ModelValue = string | number | boolean | null | ModelProp[];

type ModelTreeNode = {
  type: string;
  action?: string;
  props: ModelProp[];
  children: Array<ModelTreeNode | string> | null;
};

type ModelFlatNode = {
  id: string;
  parentId: string | null;
  type: string;
  action?: string;
  props: ModelProp[];
  text: string | null;
};

type ModelCommand = {
  op: "createNode" | "updateNode" | "removeNode";
  node: ModelFlatNode | null;
  targetId: string | null;
  children?: null;
};

const propDef = {
  type: "object" as const,
  description: "A single React prop expressed as a name/value pair.",
  properties: {
    name: {
      type: "string" as const,
      description: "React prop name.",
    },
    value: {
      description: "React prop value.",
      anyOf: [
        { type: "string" as const },
        { type: "number" as const },
        { type: "boolean" as const },
        { type: "null" as const },
        {
          type: "array" as const,
          description: "Nested object key-value pairs.",
          items: { $ref: "#/$defs/prop" },
        },
      ],
    },
  },
  required: ["name", "value"] as const,
  additionalProperties: false,
};

function createSchemaArtifacts() {
  const elementTypes = [
    ...htmlElementTypes,
    ...getDesignSystemComponentTypes().filter(
      (type) => !(formElementTypes as readonly string[]).includes(type),
    ),
  ];
  const actionDef = {
    type: "string" as const,
    enum: getActionNames(),
    description:
      "Form action to call on submit. Include required parameters; optional parameters only when the user should choose.",
  };

  const nodeDef = {
    type: "object" as const,
    properties: {
      type: {
        type: "string" as const,
        enum: elementTypes,
        description:
          "Renderable element type. Form controls accept a hidden prop to submit values without showing them to the user.",
      },
      props: {
        type: "array" as const,
        description:
          "React props as name/value pairs. Form controls may use hidden=true for inferred values the user must not edit. `style` prop is forbidden - use utility className instead.",
        items: { $ref: "#/$defs/prop" },
      },
      children: {
        description:
          "Text nodes, child elements, or null. Use null for void elements.",
        anyOf: [
          { type: "null" as const },
          {
            type: "array" as const,
            items: {
              anyOf: [
                { type: "string" as const },
                { $ref: "#/$defs/node" },
                { $ref: "#/$defs/form" },
              ],
            },
          },
        ],
      },
    },
    required: ["type", "props", "children"] as const,
    additionalProperties: false,
  };

  const formDef = {
    ...nodeDef,
    properties: {
      ...nodeDef.properties,
      type: {
        type: "string" as const,
        enum: formElementTypes,
        description:
          "Renderable form element; include required fields and visible controls for optional user choices. Optional parameters may be omitted when the user does not choose them.",
      },
      action: actionDef,
    },
    required: ["type", "action", "props", "children"] as const,
  };

  return { nodeDef, formDef };
}

function propValue(value: ModelValue): unknown {
  return Array.isArray(value)
    ? Object.fromEntries(
        value
          .filter((prop) => prop.name && prop.value !== null)
          .map((prop) => [prop.name, propValue(prop.value)]),
      )
    : value;
}

function assertPropShape(prop: ModelProp) {
  if (prop.name === "style" && !Array.isArray(prop.value)) {
    throw new Error(
      "style prop must be a React style object expressed as nested prop entries.",
    );
  }
}

function propsFromEntries(
  entries: ModelProp[],
  options?: { includeNullValues?: boolean },
) {
  entries.forEach(assertPropShape);

  const props = Object.fromEntries(
    entries
      .filter(
        (prop) =>
          prop.name && (options?.includeNullValues || prop.value !== null),
      )
      .map((prop) => [prop.name, propValue(prop.value)]),
  );

  return Object.keys(props).length > 0 ? props : undefined;
}

function assertActionName(action: string) {
  if (!getActionNames().includes(action)) {
    throw new Error(`Unsupported UI action: ${action}`);
  }
}

function assertElementType(type: string) {
  const elementTypes = [
    ...htmlElementTypes,
    ...getDesignSystemComponentTypes().filter(
      (componentType) =>
        !(formElementTypes as readonly string[]).includes(componentType),
    ),
  ];

  if (!elementTypes.includes(type)) {
    throw new Error(`Unsupported UI element type: ${type}`);
  }
}

function normalizeTreeNode(node: ModelTreeNode): BasicUiNode {
  const isForm = (formElementTypes as readonly string[]).includes(node.type);

  if (isForm) {
    if (!node.action) {
      throw new Error("Form nodes require an action.");
    }

    assertActionName(node.action);
  } else {
    assertElementType(node.type);

    if (node.action) {
      throw new Error("Only form nodes may define an action.");
    }
  }

  const props = propsFromEntries(node.props);
  const children =
    node.children?.map((child) =>
      typeof child === "string" ? child : normalizeTreeNode(child),
    ) ?? [];

  return {
    type: node.type,
    ...(node.action ? { action: node.action } : {}),
    ...(props ? { props } : {}),
    ...(children.length > 0 ? { children } : {}),
  };
}

function normalizeTreeRoot(node: ModelTreeNode): BasicUiNode {
  if ((formElementTypes as readonly string[]).includes(node.type)) {
    throw new Error("Root UI node cannot be a form.");
  }

  return normalizeTreeNode(node);
}

function normalizeFlatNode(node: ModelFlatNode): BasicUiFlatNode {
  const isForm = (formElementTypes as readonly string[]).includes(node.type);

  if (!node.id.trim()) {
    throw new Error("Flat UI nodes require an id.");
  }

  if (isForm) {
    if (!node.action) {
      throw new Error("Form nodes require an action.");
    }

    assertActionName(node.action);
  } else {
    assertElementType(node.type);

    if (node.action) {
      throw new Error("Only form nodes may define an action.");
    }
  }

  const props = propsFromEntries(node.props);

  return {
    id: node.id,
    parentId: node.parentId,
    type: node.type,
    ...(node.action ? { action: node.action } : {}),
    ...(props ? { props } : {}),
    ...(node.text !== null ? { text: node.text } : {}),
  };
}

function parseFlatNodeArray(value: unknown): BasicUiFlatNode[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("nodes" in value) ||
    !Array.isArray((value as { nodes: unknown }).nodes)
  ) {
    throw new Error("Expected generated UI to include a nodes array.");
  }

  const nodes = (value as { nodes: ModelFlatNode[] }).nodes.map(
    normalizeFlatNode,
  );
  const rootForm = nodes.find(
    (node) =>
      node.parentId === null &&
      (formElementTypes as readonly string[]).includes(node.type ?? ""),
  );

  if (rootForm) {
    throw new Error("Root UI node cannot be a form.");
  }

  return nodes;
}

function normalizeCommand(command: ModelCommand): BasicUiCommand {
  if (command.op === "removeNode") {
    if (!command.targetId?.trim()) {
      throw new Error("removeNode requires a targetId.");
    }

    return {
      op: "removeNode",
      targetId: command.targetId,
    };
  }

  if (!command.node) {
    throw new Error(`${command.op} requires a node payload.`);
  }

  const node = normalizeFlatNode(command.node);

  if (command.op === "createNode") {
    return {
      op: "createNode",
      id: node.id,
      parentId: node.parentId,
      type: node.type ?? "div",
      ...(node.action ? { action: node.action } : {}),
      ...(node.props ? { props: node.props } : {}),
      ...(node.text ? { text: node.text } : {}),
    };
  }

  const props = propsFromEntries(command.node.props, {
    includeNullValues: true,
  });
  const update: BasicUiUpdateCommand = {
    op: "updateNode",
    id: node.id,
    parentId: node.parentId,
    type: node.type ?? "div",
    ...(node.action ? { action: node.action } : {}),
    ...(props ? { props } : {}),
    text: command.node.text,
  };

  return command.children === null ? { ...update, children: null } : update;
}

function parseCommandArray(value: unknown): BasicUiCommand[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("commands" in value) ||
    !Array.isArray((value as { commands: unknown }).commands)
  ) {
    throw new Error("Expected generated UI to include a commands array.");
  }

  return (value as { commands: ModelCommand[] }).commands.map(
    normalizeCommand,
  );
}

export function getBasicUiFlatNodeArrayOutput() {
  const { nodeDef, formDef } = createSchemaArtifacts();
  const flatNodeFields = {
    id: {
      type: "string" as const,
      description: "Stable node id used to connect parent and child nodes.",
    },
    parentId: {
      description:
        "Parent node id. Top-level nodes use null; child nodes use an existing element node id.",
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
    text: {
      description:
        "Visible text for the node; null represents no node text. Use null for void elements such as input and img.",
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
  };
  const flatNodeDef = {
    type: "object" as const,
    description: "A renderable React element node.",
    properties: {
      type: nodeDef.properties.type,
      props: nodeDef.properties.props,
      ...flatNodeFields,
    },
    required: ["id", "parentId", "type", "props", "text"] as const,
    additionalProperties: false,
  };
  const flatFormDef = {
    ...flatNodeDef,
    description: "A renderable React form node.",
    properties: {
      ...flatNodeDef.properties,
      type: formDef.properties.type,
      action: formDef.properties.action,
    },
    required: ["id", "parentId", "type", "action", "props", "text"] as const,
  };

  return {
    name: "array",
    responseFormat: Promise.resolve({
      type: "json" as const,
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object" as const,
        properties: {
          nodes: {
            type: "array" as const,
            items: {
              anyOf: [flatNodeDef, flatFormDef],
            },
          },
        },
        required: ["nodes"] as const,
        additionalProperties: false,
        $defs: {
          prop: propDef,
        },
      },
      name: "basic_ui_nodes",
      description:
        "A stream of flat UI nodes. Emit parent nodes before child nodes.",
    }),
    async parseCompleteOutput({ text }: { text: string }) {
      const trimmed = text.trim();

      if (!trimmed) {
        throw new Error("The model finished without returning UI nodes.");
      }

      return parseFlatNodeArray(JSON.parse(trimmed));
    },
    async parsePartialOutput({ text }: { text: string }) {
      const result = await parsePartialJson(text);

      if (
        result.state === "failed-parse" ||
        result.state === "undefined-input" ||
        !result.value ||
        typeof result.value !== "object" ||
        !("nodes" in result.value) ||
        !Array.isArray((result.value as { nodes: unknown }).nodes)
      ) {
        return undefined;
      }

      const rawNodes = (result.value as { nodes: unknown[] }).nodes;
      const completeNodes =
        result.state === "repaired-parse" && rawNodes.length > 0
          ? rawNodes.slice(0, -1)
          : rawNodes;
      const partial = completeNodes.flatMap((node) => {
        try {
          return [normalizeFlatNode(node as ModelFlatNode)];
        } catch {
          return [];
        }
      });

      return { partial };
    },
    createElementStreamTransform() {
      let publishedNodes = 0;

      return new TransformStream<
        { partialOutput: BasicUiFlatNode[] | undefined },
        BasicUiFlatNode
      >({
        transform({ partialOutput }, controller) {
          if (!partialOutput) {
            return;
          }

          for (; publishedNodes < partialOutput.length; publishedNodes += 1) {
            controller.enqueue(partialOutput[publishedNodes]!);
          }
        },
      });
    },
  };
}

export function getBasicUiCommandArrayOutput() {
  const { nodeDef, formDef } = createSchemaArtifacts();
  const flatNodeFields = {
    id: {
      type: "string" as const,
      description: "Stable node id; preserve it across follow-up patches.",
    },
    parentId: {
      description:
        "Parent node id. Top-level nodes use null; child nodes use an existing non-void element node id.",
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
    text: {
      description:
        "Visible text for the node. Use null for void elements such as input and img. For updateNode, null leaves existing text unchanged and an empty string clears it.",
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
  };
  const flatNodeDef = {
    type: "object" as const,
    description: "A renderable React element node.",
    properties: {
      type: nodeDef.properties.type,
      props: nodeDef.properties.props,
      ...flatNodeFields,
    },
    required: ["id", "parentId", "type", "props", "text"] as const,
    additionalProperties: false,
  };
  const flatFormDef = {
    ...flatNodeDef,
    description: "A renderable React form node.",
    properties: {
      ...flatNodeDef.properties,
      type: formDef.properties.type,
      action: formDef.properties.action,
    },
    required: ["id", "parentId", "type", "action", "props", "text"] as const,
  };
  const commandNodePayloadDef = {
    description: "Flat node payload.",
    anyOf: [flatNodeDef, flatFormDef],
  };
  const commandDef = {
    description: "A UI node command: create, update, or remove.",
    anyOf: [
      {
        type: "object" as const,
        description: "createNode inserts a new node.",
        properties: {
          op: { type: "string" as const, enum: ["createNode"] },
          node: commandNodePayloadDef,
          targetId: { type: "null" as const },
        },
        required: ["op", "node", "targetId"] as const,
        additionalProperties: false,
      },
      {
        type: "object" as const,
        description:
          "updateNode patches an existing node and keeps existing child nodes. Echo unchanged scalar fields from the current node. Use text null to leave text unchanged; use an empty string to clear it. Props listed here are deep-merged.",
        properties: {
          op: { type: "string" as const, enum: ["updateNode"] },
          node: commandNodePayloadDef,
          targetId: { type: "null" as const },
        },
        required: ["op", "node", "targetId"] as const,
        additionalProperties: false,
      },
      {
        type: "object" as const,
        description:
          "updateNode with children=null patches an existing node and removes all existing child nodes. Echo unchanged scalar fields from the current node. Use text null to leave text unchanged; use an empty string to clear it. Props listed here are deep-merged.",
        properties: {
          op: { type: "string" as const, enum: ["updateNode"] },
          node: commandNodePayloadDef,
          targetId: { type: "null" as const },
          children: {
            type: "null" as const,
            description:
              "Removes all existing children from this node before later commands add new children.",
          },
        },
        required: ["op", "node", "targetId", "children"] as const,
        additionalProperties: false,
      },
      {
        type: "object" as const,
        description: "removeNode removes a node and all of its children.",
        properties: {
          op: { type: "string" as const, enum: ["removeNode"] },
          node: {
            description: "No node payload.",
            type: "null" as const,
          },
          targetId: {
            type: "string" as const,
            description: "The id of the node to remove.",
          },
        },
        required: ["op", "node", "targetId"] as const,
        additionalProperties: false,
      },
    ],
  };
  return {
    name: "array",
    responseFormat: Promise.resolve({
      type: "json" as const,
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object" as const,
        properties: {
          commands: {
            type: "array" as const,
            items: commandDef,
          },
        },
        required: ["commands"] as const,
        additionalProperties: false,
        $defs: {
          prop: propDef,
        },
      },
      name: "basic_ui_commands",
      description: "A stream of patch commands against existing flat UI nodes.",
    }),
    async parseCompleteOutput({ text }: { text: string }) {
      const trimmed = text.trim();

      if (!trimmed) {
        throw new Error("The model finished without returning UI commands.");
      }

      return parseCommandArray(JSON.parse(trimmed));
    },
    async parsePartialOutput({ text }: { text: string }) {
      const result = await parsePartialJson(text);

      if (
        result.state === "failed-parse" ||
        result.state === "undefined-input" ||
        !result.value ||
        typeof result.value !== "object" ||
        !("commands" in result.value) ||
        !Array.isArray((result.value as { commands: unknown }).commands)
      ) {
        return undefined;
      }

      const rawCommands = (result.value as { commands: unknown[] }).commands;
      const completeCommands =
        result.state === "repaired-parse" && rawCommands.length > 0
          ? rawCommands.slice(0, -1)
          : rawCommands;
      const partial = completeCommands.flatMap((command) => {
        try {
          return [normalizeCommand(command as ModelCommand)];
        } catch {
          return [];
        }
      });

      return { partial };
    },
    createElementStreamTransform() {
      let publishedCommands = 0;

      return new TransformStream<
        { partialOutput: BasicUiCommand[] | undefined },
        BasicUiCommand
      >({
        transform({ partialOutput }, controller) {
          if (!partialOutput) {
            return;
          }

          for (
            ;
            publishedCommands < partialOutput.length;
            publishedCommands += 1
          ) {
            controller.enqueue(partialOutput[publishedCommands]!);
          }
        },
      });
    },
  };
}

export function getTreeUINodeSchema() {
  const { nodeDef, formDef } = createSchemaArtifacts();

  return jsonSchema<BasicUiNode>(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      ...nodeDef,
      $defs: {
        node: nodeDef,
        form: formDef,
        prop: propDef,
      },
    },
    {
      validate(value) {
        try {
          return {
            success: true,
            value: normalizeTreeRoot(value as ModelTreeNode),
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error : new Error("Invalid UI tree."),
          };
        }
      },
    },
  );
}
