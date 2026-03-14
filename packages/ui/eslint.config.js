import { config as reactConfig } from "@workspace/eslint-config/react-internal";

export default [
  ...reactConfig,

  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname, // points to apps/web/
      },
    },
  },

  // Ignore build artifacts
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"],
  },
];
