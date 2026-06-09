import { readFileSync } from "node:fs";
import path from "node:path";

import * as ts from "typescript";

export type CapabilityKind = "read" | "action";

export type CapabilityParameter = {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  tags: Record<string, string | true>;
};

export type CapabilityDefinition = {
  name: string;
  kind: CapabilityKind;
  description: string;
  parameters: CapabilityParameter[];
  returns?: string;
};

export type DesignToken = {
  name: string;
  cssVariable: string;
  value: string;
  description: string;
  usage?: string;
};

export type DesignCatalog = {
  kind: "ui-design-catalog";
  generatedFrom: string;
  tokens: DesignToken[];
};

export type DesignSystemProp = {
  name: string;
  type: string;
  values?: Array<string | number>;
  required: boolean;
  default?: string | number | boolean;
  defaultClassName?: string;
  description: string;
};

export type DesignSystemComponent = {
  name: string;
  description: string;
  props: DesignSystemProp[];
};

export type DesignSystemCatalog = {
  kind: "ui-design-system-catalog";
  generatedFrom: string;
  components: DesignSystemComponent[];
};

type CommentTag = import("typedoc").CommentTag;
type DeclarationReflection = import("typedoc").DeclarationReflection;
type SignatureReflection = import("typedoc").SignatureReflection;

function readKind(value: string | true | undefined): CapabilityKind {
  return value === "read" ? "read" : "action";
}

function tagName(tag: CommentTag) {
  return tag.tag.startsWith("@") ? tag.tag.slice(1) : tag.tag;
}

function textFromParts(parts: readonly { text?: string }[] | undefined) {
  return (parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function textFromTag(tag: CommentTag) {
  return textFromParts(tag.content);
}

function textFromSignature(signature: SignatureReflection) {
  return textFromParts(signature.comment?.summary);
}

function tagsFromSignature(signature: SignatureReflection) {
  const tags: Record<string, string | true> = {};

  for (const tag of signature.comment?.blockTags ?? []) {
    tags[tagName(tag)] = textFromTag(tag) || true;
  }

  return tags;
}

function tagsFromParameter(
  parameter: NonNullable<SignatureReflection["parameters"]>[number],
) {
  const tags: CapabilityParameter["tags"] = {};

  for (const tag of parameter.comment?.blockTags ?? []) {
    tags[tagName(tag)] = textFromTag(tag) || true;
  }

  return tags;
}

function parameterDescription(
  parameter: NonNullable<SignatureReflection["parameters"]>[number],
) {
  return textFromParts(parameter.comment?.summary);
}

function isModelFacingParameter(tags: CapabilityParameter["tags"]) {
  return !tags.internal && !tags.hidden;
}

function readFunctionCapability(
  reflection: DeclarationReflection,
): CapabilityDefinition | null {
  const signature = reflection.signatures?.[0];
  if (!signature) {
    return null;
  }

  const tags = tagsFromSignature(signature);
  if (!tags.capability) {
    return null;
  }

  const parameters = (signature.parameters ?? []).flatMap((parameter) => {
    const parameterTags = tagsFromParameter(parameter);

    if (!isModelFacingParameter(parameterTags)) {
      return [];
    }

    return [
      {
        name: parameter.name,
        type: parameter.type?.toString() ?? "unknown",
        optional: parameter.flags.isOptional || parameter.defaultValue != null,
        description: parameterDescription(parameter),
        tags: parameterTags,
      },
    ];
  });

  return {
    name: reflection.name,
    kind: readKind(tags.capability),
    description: textFromSignature(signature),
    parameters,
    returns: typeof tags.returns === "string" ? tags.returns : undefined,
  };
}

async function readTypedocFunctions(entryPoint: string) {
  const [{ Application, ReflectionKind }, nodePath] = await Promise.all([
    import("typedoc"),
    import("node:path"),
  ]);

  const app = await Application.bootstrapWithPlugins({
    entryPoints: [nodePath.join(process.cwd(), entryPoint)],
    tsconfig: nodePath.join(process.cwd(), "tsconfig.json"),
    skipErrorChecking: true,
    logLevel: "Error",
  });
  const project = await app.convert();

  if (!project) {
    return [];
  }

  return project.getReflectionsByKind(ReflectionKind.Function);
}

export async function readCapabilityCatalog(): Promise<CapabilityDefinition[]> {
  const functions = await readTypedocFunctions("src/lib/capabilities.ts");

  return functions.flatMap((reflection) => {
    const capability = readFunctionCapability(
      reflection as DeclarationReflection,
    );
    return capability ? [capability] : [];
  });
}

function normalizePath(filePath: string) {
  return filePath.split(/[/\\]/).join("/");
}

function getUiCatalogPaths(appRoot: string) {
  return {
    designTokensPath: path.join(appRoot, "src/design/tokens.css"),
    designSystemComponentsDir: path.join(appRoot, "src/components"),
    tsconfigPath: path.join(appRoot, "tsconfig.json"),
  };
}

function readTsConfig(appRoot: string) {
  const { tsconfigPath } = getUiCatalogPaths(appRoot);
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"),
    );
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    appRoot,
  );
  if (parsed.errors.length > 0) {
    const message = parsed.errors
      .map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))
      .join("\n");
    throw new Error(message);
  }

  return parsed;
}

function splitDescriptionAndUsage(documentation: string) {
  const [description = "", ...rest] = documentation.split(/\n\s*\n/);

  return {
    description: description.trim(),
    usage: rest.join("\n\n").trim() || undefined,
  };
}

function tokenNameFromCssVariable(cssVariable: string) {
  return cssVariable
    .replace(/^--ui-color-/, "color.")
    .replace(/^--ui-/, "")
    .replace(/_/g, "-");
}

function cleanCssDocBlock(block: string) {
  return block
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .join("\n")
    .trim();
}

function getAllCssCustomProperties(cssText: string) {
  const names: string[] = [];
  const propertyPattern = /^\s*(--[a-zA-Z0-9-_]+)\s*:/gm;

  for (const match of cssText.matchAll(propertyPattern)) {
    names.push(match[1]!);
  }

  return names;
}

export function buildDesignCatalog(appRoot = process.cwd()): DesignCatalog {
  const { designTokensPath } = getUiCatalogPaths(appRoot);
  const cssText = readFileSync(designTokensPath, "utf8");
  const documentedTokenPattern =
    /\/\*\*([\s\S]*?)\*\/\s*(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  const tokens = [];

  for (const match of cssText.matchAll(documentedTokenPattern)) {
    const docs = splitDescriptionAndUsage(cleanCssDocBlock(match[1]!));
    const cssVariable = match[2]!;

    if (!docs.description) {
      throw new Error(`${cssVariable} is missing design token documentation.`);
    }

    tokens.push({
      name: tokenNameFromCssVariable(cssVariable),
      cssVariable,
      value: match[3]!.trim(),
      ...docs,
    });
  }

  const documentedNames = new Set(tokens.map((token) => token.cssVariable));
  const undocumentedNames = getAllCssCustomProperties(cssText).filter(
    (name) => !documentedNames.has(name),
  );

  if (undocumentedNames.length > 0) {
    throw new Error(
      `Design tokens are missing CSS doc comments: ${undocumentedNames.join(", ")}`,
    );
  }

  return {
    kind: "ui-design-catalog",
    generatedFrom: "src/design/tokens.css",
    tokens,
  };
}

function getExportedDesignSystemComponents(
  program: ts.Program,
  designSystemComponentsDir: string,
) {
  const components = new Map<string, ts.FunctionDeclaration>();

  for (const sourceFile of program.getSourceFiles()) {
    const normalized = normalizePath(sourceFile.fileName);
    if (
      !normalized.startsWith(normalizePath(designSystemComponentsDir)) ||
      !normalized.endsWith(".tsx")
    ) {
      continue;
    }

    ts.forEachChild(sourceFile, function visit(node) {
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      ) {
        components.set(node.name.text, node);
      }

      ts.forEachChild(node, visit);
    });
  }

  return components;
}

function documentationForSymbol(symbol: ts.Symbol, checker: ts.TypeChecker) {
  return ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .replace(/\r\n/g, "\n")
    .trim();
}

function declarationInDesignSystemDir(
  symbol: ts.Symbol,
  designSystemComponentsDir: string,
) {
  return symbol.declarations?.find((declaration) =>
    normalizePath(declaration.getSourceFile().fileName).startsWith(
      normalizePath(designSystemComponentsDir),
    ),
  );
}

function typeTextForDeclaration(
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
) {
  if (
    (ts.isPropertySignature(declaration) ||
      ts.isPropertyDeclaration(declaration)) &&
    declaration.type
  ) {
    return declaration.type.getText(declaration.getSourceFile());
  }

  return checker.typeToString(checker.getTypeAtLocation(declaration));
}

function literalValue(node: ts.Expression) {
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  return undefined;
}

function defaultValuesFromParameter(parameter: ts.ParameterDeclaration) {
  const defaults = new Map<string, string | number | boolean>();

  if (!ts.isObjectBindingPattern(parameter.name)) {
    return defaults;
  }

  for (const element of parameter.name.elements) {
    if (!ts.isBindingElement(element) || !ts.isIdentifier(element.name)) {
      continue;
    }

    if (!element.initializer) {
      continue;
    }

    const value = literalValue(element.initializer);
    if (value !== undefined) {
      defaults.set(element.name.text, value);
    }
  }

  return defaults;
}

function literalValuesFromType(type: ts.Type): Array<string | number> {
  if (type.isUnion()) {
    const values = type.types.flatMap((item) => literalValuesFromType(item));
    return values.length === type.types.length ? values : [];
  }

  if (type.isStringLiteral()) {
    return [type.value];
  }

  if (type.isNumberLiteral()) {
    return [type.value];
  }

  return [];
}

function literalValuesFromTypeText(typeText: string) {
  const stringMatches = [...typeText.matchAll(/"([^"]+)"/g)].map(
    (match) => match[1]!,
  );
  if (stringMatches.length > 0) {
    return stringMatches;
  }

  return [...typeText.matchAll(/\b\d+(?:\.\d+)?\b/g)].map((match) =>
    Number(match[0]),
  );
}

function extractDesignSystemProps(
  functionNode: ts.FunctionDeclaration,
  checker: ts.TypeChecker,
  designSystemComponentsDir: string,
): DesignSystemProp[] {
  const [propsParameter] = functionNode.parameters;
  if (!propsParameter?.type) {
    return [];
  }

  const defaults = defaultValuesFromParameter(propsParameter);
  const propsType = checker.getTypeFromTypeNode(propsParameter.type);

  return propsType
    .getProperties()
    .map((property) => {
      const declaration = declarationInDesignSystemDir(
        property,
        designSystemComponentsDir,
      );

      if (!declaration) {
        return null;
      }

      const description = documentationForSymbol(property, checker);
      const type = checker.getTypeOfSymbolAtLocation(property, declaration);
      const typeText = typeTextForDeclaration(declaration, checker);
      const values = [
        ...new Set([
          ...literalValuesFromType(type),
          ...literalValuesFromTypeText(typeText),
        ]),
      ];
      const defaultValue = defaults.get(property.getName());
      const defaultTag = property
        .getJsDocTags(checker)
        .find((tag) => tag.name === "default");
      const defaultTagText = defaultTag
        ? ts
            .displayPartsToString(defaultTag.text ?? [])
            .trim()
            .replace(/^["']|["']$/g, "")
        : undefined;

      return {
        name: property.getName(),
        type: typeText,
        ...(values.length > 0 ? { values } : {}),
        required:
          ts.isPropertySignature(declaration) ||
          ts.isPropertyDeclaration(declaration)
            ? declaration.questionToken === undefined
            : false,
        ...(defaultValue !== undefined ? { default: defaultValue } : {}),
        ...(defaultTagText ? { defaultClassName: defaultTagText } : {}),
        description: description || "",
      } satisfies DesignSystemProp;
    })
    .filter((prop): prop is DesignSystemProp => prop !== null);
}

export function buildDesignSystemCatalog(
  appRoot = process.cwd(),
): DesignSystemCatalog {
  const { designSystemComponentsDir } = getUiCatalogPaths(appRoot);
  const parsedConfig = readTsConfig(appRoot);
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
  });
  const checker = program.getTypeChecker();
  const components = [
    ...getExportedDesignSystemComponents(
      program,
      designSystemComponentsDir,
    ).entries(),
  ]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([name, component]) => {
      const symbol = checker.getSymbolAtLocation(component.name!);
      if (!symbol) {
        throw new Error(`${name} is missing a TypeScript symbol.`);
      }

      const description = documentationForSymbol(symbol, checker);
      if (!description) {
        throw new Error(`${name} is missing component TSDoc.`);
      }

      return {
        name,
        description,
        props: extractDesignSystemProps(
          component,
          checker,
          designSystemComponentsDir,
        ),
      };
    });

  return {
    kind: "ui-design-system-catalog",
    generatedFrom: "src/components/**/*.tsx",
    components,
  };
}

let designSystemCatalog: DesignSystemCatalog | null = null;
let designCatalog: DesignCatalog | null = null;

export function getDesignCatalog() {
  designCatalog ??= buildDesignCatalog();
  return designCatalog;
}

export function getDesignSystemCatalog() {
  designSystemCatalog ??= buildDesignSystemCatalog();
  return designSystemCatalog;
}

const knownTypeAliases: Record<string, string> = {
  ButtonVariant: '"primary" | "ghost"',
};

function formatProp(prop: DesignSystemProp) {
  const opt = prop.required ? "" : "?";
  const typeStr = prop.values?.length
    ? prop.values.map((value) => JSON.stringify(value)).join(" | ")
    : (knownTypeAliases[prop.type] ?? prop.type);
  const def =
    prop.default !== undefined ? ` = ${JSON.stringify(prop.default)}` : "";
  const defCls = prop.defaultClassName
    ? ` @default "${prop.defaultClassName}"`
    : "";
  const desc = prop.description ? ` - ${prop.description}` : "";

  return `  ${prop.name}${opt}: ${typeStr}${def}${defCls}${desc}`;
}

export function getDesignSystemCatalogText() {
  return getDesignSystemCatalog()
    .components.map((component) => {
      const props = component.props.map(formatProp).join("\n");
      return `${component.name} - ${component.description}\n${props}`;
    })
    .join("\n\n");
}

export function getDefaultClassNameTokens() {
  const tokens = new Set<string>();

  for (const component of getDesignSystemCatalog().components) {
    for (const prop of component.props) {
      if (!prop.defaultClassName) {
        continue;
      }

      for (const token of prop.defaultClassName.split(/\s+/)) {
        if (token) {
          tokens.add(token);
        }
      }
    }
  }

  return tokens;
}

export function getDesignTokensText() {
  return getDesignCatalog()
    .tokens.filter((token) => token.name.startsWith("color."))
    .map(
      (token) =>
        `  ${token.name.replace("color.", "")} (${token.value}) - ${token.description}`,
    )
    .join("\n");
}

export function getDesignSystemComponentTypes() {
  return getDesignSystemCatalog().components.map((component) => component.name);
}
