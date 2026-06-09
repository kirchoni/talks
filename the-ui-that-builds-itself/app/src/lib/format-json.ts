import prettier from "prettier/standalone";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";

function toJsonSource(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value ?? null);
}

export async function formatJsonValue(value: unknown): Promise<string> {
  const source = toJsonSource(value);

  try {
    JSON.parse(source);
  } catch {
    return source;
  }

  try {
    return await prettier.format(source, {
      parser: "json",
      plugins: [prettierPluginEstree, prettierPluginBabel],
      printWidth: 80,
      tabWidth: 2,
    });
  } catch {
    try {
      return JSON.stringify(JSON.parse(source), null, 2);
    } catch {
      return source;
    }
  }
}
