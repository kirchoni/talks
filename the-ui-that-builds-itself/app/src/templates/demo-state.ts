export type ClientDemoState = Record<string, unknown>;

export type DemoUser = {
  id: string;
  name: string;
  email: string;
};

export const loggedOutClientState: ClientDemoState = {
  user: null,
  accountId: null,
  cart: {
    items: [],
  },
};

export const demoLogin = {
  username: "kiril",
  password: "boxel",
  state: {
    user: {
      id: "user_kiril",
      name: "Kiril Peyanski",
      email: "kiril@boxel.dev",
    },
    accountId: "acct_boxel_demo",
  },
} satisfies {
  username: string;
  password: string;
  state: ClientDemoState;
};

export const clientStateStorageKey = "boxel-demo-client-state";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeClientState(value: unknown): ClientDemoState {
  return isRecord(value) ? value : loggedOutClientState;
}

export function preserveAuthClientState(state: ClientDemoState): ClientDemoState {
  const user = getCurrentUser(state);

  if (!user) {
    return loggedOutClientState;
  }

  return {
    user,
    accountId:
      typeof state.accountId === "string" && state.accountId.length > 0
        ? state.accountId
        : null,
    cart: {
      items: [],
    },
  };
}

export function stripAuthClientState(state: ClientDemoState): ClientDemoState {
  return {
    ...state,
    user: null,
    accountId: null,
  };
}

export function getCurrentUser(state: ClientDemoState): DemoUser | null {
  const user = state.user;

  if (!isRecord(user)) {
    return null;
  }

  return typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string"
    ? { id: user.id, name: user.name, email: user.email }
    : null;
}

export function getUserInitials(user: DemoUser | null) {
  if (!user) {
    return "?";
  }

  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
