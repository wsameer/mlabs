# `@workspace/eslint-config`

Shared eslint configuration for the workspace.

```bash
Root eslint.config.js
  ├─ Ignores apps/** and packages/**
  └─ Only lints root-level files (if you have any)

apps/web/eslint.config.js
  └─ IMPORTS from @workspace/eslint-config/react-internal
      └─ Uses those shared rules

apps/api/eslint.config.js
  └─ IMPORTS from @workspace/eslint-config/node
      └─ Uses those shared rules

packages/ui/eslint.config.js
  └─ IMPORTS from @workspace/eslint-config/react-internal
      └─ Uses those shared rules
```
