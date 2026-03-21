import { config as nodeConfig } from "@workspace/eslint-config/node";

export default [
  ...nodeConfig,

  {
    files: ["**/*.ts"],
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
