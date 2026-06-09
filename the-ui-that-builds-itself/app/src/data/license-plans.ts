export type LicenseAddon = {
  id: string;
  name: string;
  description: string;
  monthlyPriceUsd: number;
  formFieldName: string;
};

export type LicensePlan = {
  id: string;
  name: string;
  description: string;
  monthlyPriceUsd: number | null;
  includedSeats: number | "unlimited";
  includedProjects: number | "unlimited";
  support: string;
  addons: LicenseAddon[];
};

const licensePlans: LicensePlan[] = [
  {
    id: "team",
    name: "Team",
    description: "Core Boxel workspace features for a small product team.",
    monthlyPriceUsd: 49,
    includedSeats: 5,
    includedProjects: 3,
    support: "Email support",
    addons: [
      {
        id: "onboarding",
        name: "Guided onboarding",
        description: "A Boxel specialist helps configure the first workspace.",
        monthlyPriceUsd: 19,
        formFieldName: "includeOnboarding",
      },
      {
        id: "priority-support",
        name: "Priority support",
        description: "Faster support responses for launch week issues.",
        monthlyPriceUsd: 29,
        formFieldName: "includePrioritySupport",
      },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Higher limits and collaboration controls for growing teams.",
    monthlyPriceUsd: 149,
    includedSeats: 25,
    includedProjects: "unlimited",
    support: "Priority support",
    addons: [
      {
        id: "onboarding",
        name: "Guided onboarding",
        description: "A Boxel specialist helps configure the first workspace.",
        monthlyPriceUsd: 19,
        formFieldName: "includeOnboarding",
      },
      {
        id: "compliance-pack",
        name: "Compliance pack",
        description: "Audit exports and a quarterly access review checklist.",
        monthlyPriceUsd: 79,
        formFieldName: "includeCompliancePack",
      },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom licensing, security controls, and support terms.",
    monthlyPriceUsd: null,
    includedSeats: "unlimited",
    includedProjects: "unlimited",
    support: "Dedicated support with SLA",
    addons: [],
  },
];

export function listLicensePlans(): LicensePlan[] {
  return licensePlans;
}
