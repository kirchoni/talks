import { getUnoSharedConfig } from "./uno.shared";

export default {
  ...getUnoSharedConfig(),
  content: {
    filesystem: [
      "src/templates/**/*.{tsx,ts}",
      "src/components/**/*.{tsx,ts}",
    ],
  },
};
