import { config as baseConfig } from "@workspace/eslint-config/base";

export default [
  ...baseConfig,

  {
    files: ["**/*.ts", "**/*.d.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"],
  },
];
