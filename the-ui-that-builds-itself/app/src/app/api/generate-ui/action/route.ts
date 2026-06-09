import { actionHandlers } from "@/lib/capabilities";
import {
  loggedOutClientState,
  normalizeClientState,
} from "@/templates/demo-state";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const { action, args } = body as {
    action?: string;
    args?: Record<string, string>;
  };
  const state = normalizeClientState(
    "state" in body ? body.state : loggedOutClientState,
  );

  if (!action || !actionHandlers[action]) {
    return Response.json(
      { error: `Unknown action: ${action}` },
      { status: 400 },
    );
  }

  const actionResult = actionHandlers[action]({ args: args ?? {}, state });
  const result =
    actionResult &&
    typeof actionResult === "object" &&
    !Array.isArray(actionResult) &&
    "result" in actionResult
      ? (actionResult as { result: unknown }).result
      : actionResult;
  const statePatch =
    actionResult &&
    typeof actionResult === "object" &&
    !Array.isArray(actionResult) &&
    "statePatch" in actionResult
      ? (actionResult as { statePatch: unknown }).statePatch
      : null;

  return Response.json({ action, result, statePatch });
}
