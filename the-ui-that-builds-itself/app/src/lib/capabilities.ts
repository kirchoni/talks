type ActionInput = {
  args: Record<string, string>;
  state: Record<string, unknown>;
};

type LicenseCartItem = {
  planId: string;
  quantity: number;
  addonOnboarding: boolean;
  addonPrioritySupport: boolean;
  addonCompliancePack: boolean;
};

type LicenseCart = {
  items: LicenseCartItem[];
};

type CartAddonSelection = Pick<
  LicenseCartItem,
  "addonOnboarding" | "addonPrioritySupport" | "addonCompliancePack"
>;

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

const emptyCart: LicenseCart = { items: [] };
const emptyCartJson = JSON.stringify(emptyCart);

function readOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function readBoolean(value: string | undefined) {
  return value === "true" || value === "on" || value === "1" || value === "yes";
}

function readCartItemAddons(
  record: Record<string, unknown>,
): CartAddonSelection {
  return {
    addonOnboarding: record.addonOnboarding === true,
    addonPrioritySupport: record.addonPrioritySupport === true,
    addonCompliancePack: record.addonCompliancePack === true,
  };
}

function sameCartItem(
  item: LicenseCartItem,
  planId: string,
  addons: CartAddonSelection,
) {
  return (
    item.planId === planId &&
    item.addonOnboarding === addons.addonOnboarding &&
    item.addonPrioritySupport === addons.addonPrioritySupport &&
    item.addonCompliancePack === addons.addonCompliancePack
  );
}

function createCartItem(
  planId: string,
  quantity: number,
  addons: CartAddonSelection,
): LicenseCartItem {
  return {
    planId,
    quantity: Math.max(1, quantity),
    ...addons,
  };
}

function readCartItem(record: Record<string, unknown>): LicenseCartItem {
  return createCartItem(
    typeof record.planId === "string" ? record.planId : "",
    typeof record.quantity === "number" ? record.quantity : 1,
    readCartItemAddons(record),
  );
}

function readCart(value: unknown): LicenseCart {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyCart;
  }

  const items = "items" in value ? value.items : undefined;

  return {
    items: Array.isArray(items)
      ? items.map((item) => {
          const record =
            item && typeof item === "object" && !Array.isArray(item)
              ? (item as Record<string, unknown>)
              : {};

          return readCartItem(record);
        })
      : [],
  };
}

function readCartJson(cartJson: string): LicenseCart {
  if (!cartJson.trim()) {
    return emptyCart;
  }

  try {
    return readCart(JSON.parse(cartJson));
  } catch {
    return emptyCart;
  }
}

/**
 * Signs in with the demo account. Needed before checkout when the session
 * snapshot has no accountId.
 * @capability action
 * @returns ok, message, statePatch?.
 */
export function login(
  /** Demo username. */
  username: string,
  /** Demo password. */
  password: string,
) {
  if (username !== "kiril" || password !== "boxel") {
    return {
      result: {
        ok: false,
        message: "Invalid demo credentials.",
      },
      statePatch: null,
    };
  }

  return {
    result: {
      ok: true,
      message: "Signed in.",
    },
    statePatch: {
      user: {
        id: "user_kiril",
        name: "Kiril Peyanski",
        email: "kiril@boxel.dev",
      },
      accountId: "acct_boxel_demo",
    },
  };
}

/**
 * First step of online purchase; adds a selected license plan to the session
 * cart.
 * @capability action
 * @returns ok, message, statePatch?.
 */
export function addToCart(
  /** Selected license plan id. */
  planId: string,
  /** Number of licenses to add. */
  quantity = 1,
  /** Current cart JSON from session snapshot; include in form as a hidden field. */
  cart: string,
  /** Include guided onboarding add-on. */
  addonOnboarding?: boolean,
  /** Include priority support add-on. */
  addonPrioritySupport?: boolean,
  /** Include compliance pack add-on. */
  addonCompliancePack?: boolean,
) {
  const currentCart = readCartJson(cart);
  const addons: CartAddonSelection = {
    addonOnboarding: addonOnboarding === true,
    addonPrioritySupport: addonPrioritySupport === true,
    addonCompliancePack: addonCompliancePack === true,
  };
  const existingIndex = currentCart.items.findIndex((item) =>
    sameCartItem(item, planId, addons),
  );
  const items = [...currentCart.items];

  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    items[existingIndex] = {
      ...existing,
      quantity: existing.quantity + Math.max(1, quantity),
    };
  } else {
    items.push(createCartItem(planId, quantity, addons));
  }

  return {
    result: {
      ok: true,
      message: `Added ${planId} to cart.`,
    },
    statePatch: {
      cart: { items },
    },
  };
}

/**
 * Cart review step; updates the quantity and add-ons for an item in the current
 * cart.
 * @after addToCart
 * @capability action
 * @returns ok, message, statePatch?.
 */
export function updateCart(
  /** Selected license plan id. */
  planId: string,
  /** Number of licenses for this cart item. */
  quantity = 1,
  /** Current cart JSON from session snapshot; include in form as a hidden field. */
  cart: string,
  /** Include guided onboarding add-on. */
  addonOnboarding?: boolean,
  /** Include priority support add-on. */
  addonPrioritySupport?: boolean,
  /** Include compliance pack add-on. */
  addonCompliancePack?: boolean,
) {
  const currentCart = readCartJson(cart);
  const addons: CartAddonSelection = {
    addonOnboarding: addonOnboarding === true,
    addonPrioritySupport: addonPrioritySupport === true,
    addonCompliancePack: addonCompliancePack === true,
  };
  let updated = false;
  const items = currentCart.items.map((item) => {
    if (!updated && item.planId === planId) {
      updated = true;
      return createCartItem(planId, quantity, addons);
    }

    return item;
  });

  return {
    result: {
      ok: true,
      message: `Updated ${planId} in cart.`,
    },
    statePatch: {
      cart: { items },
    },
  };
}

/**
 * Cart review step; removes an item from the current cart.
 * @after addToCart
 * @capability action
 * @returns ok, message, statePatch?.
 */
export function removeFromCart(
  /** Selected license plan id. */
  planId: string,
  /** Current cart JSON from session snapshot; include in form as a hidden field. */
  cart: string,
) {
  const currentCart = readCartJson(cart);
  const removeIndex = currentCart.items.findIndex(
    (item) => item.planId === planId,
  );
  const items =
    removeIndex >= 0
      ? [
          ...currentCart.items.slice(0, removeIndex),
          ...currentCart.items.slice(removeIndex + 1),
        ]
      : currentCart.items;

  return {
    result: {
      ok: true,
      message: `Removed ${planId} from cart.`,
    },
    statePatch: {
      cart: { items },
    },
  };
}

/**
 * Final step of online purchase; charges the signed-in account for the current
 * cart. Requires a non-empty cart and accountId in the session snapshot.
 * @after addToCart
 * @capability action
 * @returns success, message, licenseIds?, statePatch?.
 */
export function checkout(
  /** Signed-in account id from session snapshot; include in form as a hidden field. */
  accountId: string,
  /** Current cart JSON from session snapshot; include in form as a hidden field. */
  cart: string,
  /** Billing cycle: monthly or yearly. */
  billingCycle: "monthly" | "yearly",
  /** Cardholder name. */
  cardholderName: string,
  /**
   * Card number.
   * @minLength 12
   */
  cardNumber: string,
  /**
   * Expiry month.
   * @type date
   * @format YYYY-MM
   */
  expiryMonth: string,
  /**
   * CVC.
   * @minLength 3
   * @maxLength 3
   * @pattern ^\d{3}$
   */
  cvc: string,
) {
  const parsedCart = readCartJson(cart);

  if (!accountId) {
    return {
      result: {
        success: false,
        message: "accountId is required.",
      },
      statePatch: null,
    };
  }

  if (parsedCart.items.length === 0) {
    return {
      result: {
        success: false,
        message: "Cart is empty.",
      },
      statePatch: null,
    };
  }

  if (
    !cardholderName.trim() ||
    cardNumber.replace(/\D/g, "").length < 12 ||
    !expiryMonth.trim() ||
    !/^\d{3}$/.test(cvc)
  ) {
    return {
      result: {
        success: false,
        message: "Payment details are incomplete.",
      },
      statePatch: null,
    };
  }

  return {
    result: {
      success: true,
      message: `Purchased ${parsedCart.items.length} cart item(s) with ${billingCycle} billing.`,
      licenseIds: parsedCart.items.map(
        (item, index) => `lic_${item.planId}_${Date.now()}_${index + 1}`,
      ),
    },
    statePatch: {
      cart: emptyCart,
    },
  };
}

/**
 * Starts a trial workspace for a plan that supports trials.
 * @capability action
 * @returns ok, message, trialId?.
 */
export function startTrial(
  /** Selected license plan id. */
  planId: string,
  /** Work email for the trial owner. */
  workEmail: string,
  /** Company name. */
  companyName?: string,
) {
  if (!planId.trim()) {
    return { ok: false, message: "planId is required." };
  }

  if (!workEmail.includes("@")) {
    return { ok: false, message: "A valid workEmail is required." };
  }

  return {
    ok: true,
    message: `Started a 14 day ${planId} trial for ${workEmail}.`,
    trialId: `trial_${planId}_${Date.now()}`,
    companyName: companyName?.trim() || undefined,
  };
}

/**
 * Requests sales follow-up for a custom license quote.
 * @capability action
 * @returns ok, message, quoteId?.
 */
export function requestQuote(
  /** Selected license plan id. */
  planId: string,
  /** Work email for the buyer. */
  workEmail: string,
  /** Company name. */
  companyName: string,
  /** Estimated number of seats. */
  seats?: number,
) {
  if (!planId.trim() || !companyName.trim()) {
    return { ok: false, message: "planId and companyName are required." };
  }

  if (!workEmail.includes("@")) {
    return { ok: false, message: "A valid workEmail is required." };
  }

  return {
    ok: true,
    message: `Requested a ${planId} quote for ${companyName}.`,
    quoteId: `quote_${Date.now()}`,
    seats,
  };
}

/**
 * Applies for an open Boxel role.
 * @capability action
 * @returns ok, message, applicationId?.
 */
export function applyForJob(
  /** Open role id. */
  jobId: string,
  /** Candidate full name. */
  fullName: string,
  /** Candidate email. */
  email: string,
  /** Optional profile or portfolio URL. */
  profileUrl?: string,
  /** Optional note from the candidate. */
  coverNote?: string,
) {
  if (!jobId.trim() || !fullName.trim()) {
    return { ok: false, message: "jobId and fullName are required." };
  }

  if (!email.includes("@")) {
    return { ok: false, message: "A valid email is required." };
  }

  return {
    ok: true,
    message: `Submitted application for ${jobId} from ${fullName}.`,
    applicationId: `app_${Date.now()}`,
    profileUrl: profileUrl?.trim() || undefined,
    coverNote: coverNote?.trim() || undefined,
  };
}

export function getActionNames() {
  return Object.keys(actionHandlers);
}

export const actionHandlers: Record<string, (input: ActionInput) => unknown> = {
  login: ({ args }) => login(args.username ?? "", args.password ?? ""),
  addToCart: ({ args }) =>
    addToCart(
      args.planId ?? "",
      args.quantity ? Number(args.quantity) : 1,
      args.cart ?? emptyCartJson,
      readBoolean(args.addonOnboarding),
      readBoolean(args.addonPrioritySupport),
      readBoolean(args.addonCompliancePack),
    ),
  updateCart: ({ args }) =>
    updateCart(
      args.planId ?? "",
      args.quantity ? Number(args.quantity) : 1,
      args.cart ?? emptyCartJson,
      readBoolean(args.addonOnboarding),
      readBoolean(args.addonPrioritySupport),
      readBoolean(args.addonCompliancePack),
    ),
  removeFromCart: ({ args }) =>
    removeFromCart(args.planId ?? "", args.cart ?? emptyCartJson),
  checkout: ({ args }) =>
    checkout(
      args.accountId ?? "",
      args.cart ?? emptyCartJson,
      args.billingCycle === "yearly" ? "yearly" : "monthly",
      args.cardholderName ?? "",
      args.cardNumber ?? "",
      args.expiryMonth ?? "",
      args.cvc ?? "",
    ),
  startTrial: ({ args }) =>
    startTrial(args.planId ?? "", args.workEmail ?? "", args.companyName),
  requestQuote: ({ args }) =>
    requestQuote(
      args.planId ?? "",
      args.workEmail ?? "",
      args.companyName ?? "",
      readOptionalNumber(args.seats),
    ),
  applyForJob: ({ args }) =>
    applyForJob(
      args.jobId ?? "",
      args.fullName ?? "",
      args.email ?? "",
      args.profileUrl,
      args.coverNote,
    ),
};
