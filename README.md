# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Local development (app local + DB in Docker)

```bash
cp .env.example .env
pnpm db:docker:up
pnpm db:bootstrap
pnpm dev
```

Use `pnpm db:bootstrap:seed` instead of `pnpm db:bootstrap` if you want sample data.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
