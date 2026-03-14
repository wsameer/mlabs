// eslint.config.js (root)
import { config as baseConfig } from "@workspace/eslint-config/base";

export default [
  ...baseConfig,

  // Ignore apps and packages - they have their own configs
  globalIgnores([
    "apps/**",
    "packages/**",
    "**/node_modules/**",
    "**/.turbo/**",
  ]),

  // Root-level TypeScript files (if any)
  {
    files: ["*.ts", "*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
