# Zustand Store Architecture

This document explains the recommended patterns for working with Zustand in this project.

## Structure

```
stores/
├── slices/           # State slices (domain-separated state)
├── selectors/        # Pure selector functions
├── hooks/            # Custom hooks for components
└── app-store.ts      # Combined store with middleware
```

## Best Practices

### 1. Creating State Slices

Each slice should be self-contained with its own state and actions:

```typescript
// stores/slices/example-slice.ts
export type ExampleSlice = {
  // State
  value: string;
  count: number;

  // Actions
  setValue: (value: string) => void;
  increment: () => void;
};

export const createExampleSlice: StateCreator<AppStoreState, [["zustand/immer", never]], [], ExampleSlice> = (set) => ({
  value: "",
  count: 0,

  setValue: (value) => set((state) => { state.value = value }),
  increment: () => set((state) => { state.count += 1 }),
});
```

### 2. Creating Selectors

Selectors are pure functions that extract specific values from the store:

```typescript
// stores/selectors/example-selectors.ts
export const valueSelector = (state: AppStoreState) => state.value;
export const countSelector = (state: AppStoreState) => state.count;
```

**Why selectors?**
- Auto-optimization (component only re-renders when selected value changes)
- Reusable across components
- Easy to test
- Better DevTools integration

### 3. Creating Hooks

Hooks are the **primary way** components should consume the store:

```typescript
// hooks/use-example.ts
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/stores";
import { valueSelector, countSelector } from "@/stores/selectors/example-selectors";

// ✅ ATOMIC HOOKS (use by default)
export const useValue = () => useAppStore(valueSelector);
export const useCount = () => useAppStore(countSelector);

// ✅ GROUPED HOOKS (only when values are ALWAYS consumed together)
export const useExampleData = () =>
  useAppStore(
    useShallow((state) => ({
      value: state.value,
      count: state.count,
    }))
  );

// ✅ ACTIONS HOOK (separate from state)
export const useExampleActions = () =>
  useAppStore(
    useShallow((state) => ({
      setValue: state.setValue,
      increment: state.increment,
    }))
  );
```

### 4. Using Hooks in Components

```typescript
// ✅ RECOMMENDED: Use atomic hooks
function MyComponent() {
  const value = useValue();
  const { setValue } = useExampleActions();

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

// ✅ ALSO GOOD: Use grouped hook when consuming multiple related values
function MyComponent() {
  const { value, count } = useExampleData();
  const { setValue, increment } = useExampleActions();

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={increment}>Count: {count}</button>
    </div>
  );
}

// ❌ AVOID: Direct store access in components
function MyComponent() {
  const value = useAppStore((state) => state.value); // ❌ Use hooks instead
}
```

## When to Use Each Pattern

### Atomic Hooks (Default Choice)
Use when a component needs **one or a few independent values**:

```typescript
const profile = useAppProfile();
const status = useAppStatus();
```

**Pros:**
- Maximum optimization
- Clear dependencies
- Easy to track what causes re-renders

### Grouped Hooks (Use Sparingly)
Use when values are **always consumed together** and change together:

```typescript
const { profile, profiles, hasAccount } = useAppProfileData();
```

**Use when:**
- Values have semantic relationship (e.g., profile + hasAccount)
- Always accessed together in the same component
- Simplifies component API

**Avoid when:**
- Values change at different frequencies
- Only sometimes needed together
- "Convenience" grouping (use atomic instead)

### Actions Hooks
Always separate actions from state:

```typescript
const { syncProfile, completeOnboarding } = useAppActions();
```

**Why?**
- Actions are stable references (don't cause re-renders)
- Clear separation of concerns
- Better code organization

## File Naming Conventions

- **Slices**: `[domain]-slice.ts` (e.g., `app-slice.ts`, `ui-slice.ts`)
- **Selectors**: `[domain]-selectors.ts` (e.g., `app-selectors.ts`)
- **Hooks**: `use-[domain].ts` (e.g., `use-app.ts`, `use-ui.ts`)

## Migration Checklist

When adding new state:

1. ✅ Create/update slice in `stores/slices/`
2. ✅ Add selectors in `stores/selectors/`
3. ✅ Create hooks in `hooks/`
4. ✅ Use hooks in components (never direct `useAppStore` access)
5. ✅ Export hooks from a central location if needed

## Examples in Codebase

- **App State**: `stores/slices/app-slice.ts` → `selectors/app-selectors.ts` → `hooks/use-app.ts`
- **Layout State**: `stores/slices/layout-slice.ts` → `selectors/layout-selectors.ts` → `hooks/use-layout.ts`
- **UI State**: `stores/slices/ui-slice.ts` → `selectors/ui-selectors.ts` → `hooks/use-ui-store.ts`
- **Filters**: `stores/slices/filters-slice.ts` → `selectors/filters-selectors.ts` → `hooks/use-filters.ts`

### Real-World Example: Layout State

**Components using atomic hooks:**
```typescript
// AppSidebar.tsx - needs only sidebar content
import { useSidebarLeftContent } from "@/hooks/use-layout";

function AppSidebar() {
  const sidebarLeftContent = useSidebarLeftContent();
  return <SidebarGroupContent>{sidebarLeftContent}</SidebarGroupContent>;
}
```

**Components using grouped hooks:**
```typescript
// AppHeader.tsx - needs title, actions, and mobileBackPath together
import { useHeaderConfig } from "@/hooks/use-layout";

function AppHeader() {
  const { title, actions, mobileBackPath } = useHeaderConfig();
  return (
    <header>
      <h1>{title}</h1>
      {actions}
      {mobileBackPath && <BackButton />}
    </header>
  );
}
```

**Components using action hooks:**
```typescript
// SettingsPage.tsx - only needs to set values
import { useLayoutActions } from "@/hooks/use-layout";

function SettingsPage() {
  const { setHeaderTitle, setHeaderActions } = useLayoutActions();

  useEffect(() => {
    setHeaderTitle("Settings");
    return () => resetLayout();
  }, []);
}
```

## DevTools

Access store in browser console:
```js
// Get current state
window.store.get()

// Pretty print
window.store.log()
```

Install [Redux DevTools](https://github.com/reduxjs/redux-devtools) for time-travel debugging!
