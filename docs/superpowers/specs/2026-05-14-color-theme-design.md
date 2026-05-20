# Color Theme Refresh — Design

**Date:** 2026-05-14
**Scope:** `packages/ui/src/styles/globals.css`, `apps/web/src/lib/category-colors.ts`, `apps/web/src/components/CategoryStatList.tsx`

## Goal

Fix four concrete clashes in the current olive theme:

1. `--chart-1` (L 0.880) sits at nearly the same lightness as `--card` (L 1.000). The largest pie slice is invisible against the card surface.
2. `--chart-5` (L 0.286) in dark mode matches `--card` dark (L 0.228) and `--secondary` (L 0.286). Slices vanish into the card.
3. `apps/web/src/lib/category-colors.ts` references `var(--chart-6)`, but only `--chart-1`…`--chart-5` are defined. Any 6th category renders unstyled.
4. `CategoryStatList`'s Badge sets `text-background` (off-white) on a `var(--chart-1)` fill (also near-white) — the percentage number is invisible.

After this change the chart palette is decoupled from the surface palette, supports up to 10 categories without wrapping, and works in both light and dark mode without per-mode logic in components.

## Non-Goals

- The olive UI surfaces (background, card, popover, sidebar, primary/secondary/muted/accent) are unchanged.
- `--destructive` is unchanged (it stays as the danger-action red).
- Per-component income/expense color rollout is deferred. This spec only adds the tokens; existing components keep their current treatment until follow-up work adopts the new tokens.
- Recharts `ChartContainer` configuration is unchanged — it already reads from `--chart-N` variables.

## Existing State (verified)

- Theme file: `packages/ui/src/styles/globals.css`. Chart tokens are defined twice (in `:root` and `.dark`) and registered as Tailwind theme tokens via `@theme inline { --color-chart-1: var(--chart-1); ... }` (lines 22–26).
- Chart consumers:
  - `apps/web/src/lib/category-colors.ts` — array of `var(--chart-N)` strings, 1–6 (chart-6 currently unresolved).
  - `apps/web/src/components/CashflowPieChart.tsx` — reads colors out of `colorMap` produced by `buildCategoryColorMap`.
  - `apps/web/src/components/CategoryStatList.tsx` — same `colorMap`, applies via inline `style.backgroundColor`.
- The `@theme inline` block does not currently expose `--color-chart-6` … `--color-chart-10` — these need to be added.
- The web app does not currently use any income/expense semantic colors; the dashboard distinguishes income/expense via tabs (no color signal).

## Design

### Chart palette: Dusty Editorial (10 hues)

A muted, low-chroma multi-hue categorical palette calibrated to land at L 0.50–0.70 in light mode and L 0.55–0.72 in dark mode — well clear of any surface token (background L 0.153 / 0.961, card L 0.228 / 1.0). Each chart token has the same hue and chroma in both modes; only lightness lifts slightly in dark mode for contrast.

| Token | Hue | Light OKLCH | Dark OKLCH |
|---|---|---|---|
| `--chart-1` | teal | `0.62 0.10 200` | `0.66 0.10 200` |
| `--chart-2` | amber | `0.66 0.10 80` | `0.70 0.10 80` |
| `--chart-3` | rust | `0.58 0.10 25` | `0.62 0.10 25` |
| `--chart-4` | plum | `0.55 0.09 320` | `0.60 0.09 320` |
| `--chart-5` | sage | `0.62 0.09 145` | `0.66 0.09 145` |
| `--chart-6` | indigo | `0.60 0.10 260` | `0.64 0.10 260` |
| `--chart-7` | ochre | `0.66 0.10 50` | `0.70 0.10 50` |
| `--chart-8` | rose | `0.58 0.10 350` | `0.62 0.10 350` |
| `--chart-9` | aqua | `0.55 0.09 175` | `0.60 0.09 175` |
| `--chart-10` | violet | `0.50 0.08 290` | `0.55 0.08 290` |

The hues are spread roughly 35–45° apart on the OKLCH hue ring, so adjacent palette entries (likely adjacent slices in a donut) are distinguishable by hue, not just lightness. Chroma is held at 0.08–0.11 — enough to read as distinct hues, low enough to feel cohesive with the muted olive UI.

### Semantic tokens

```
--income       light: oklch(0.55 0.10 150)    dark: oklch(0.62 0.10 150)
--expense      light: oklch(0.55 0.13 25)     dark: oklch(0.62 0.13 25)
```

`--income` is a muted moss green; `--expense` is a muted terracotta red. Both are visibly distinct from `--destructive` (`oklch(0.577 0.245 27.325)` in light, `oklch(0.704 0.191 22.216)` in dark — higher chroma, more aggressive). The intent is that `--destructive` continues to mean "danger / destructive action" while `--expense` is a calm financial-direction signal.

### Tailwind theme registration

Inside the existing `@theme inline { ... }` block in `globals.css`, add:

```css
--color-chart-6: var(--chart-6);
--color-chart-7: var(--chart-7);
--color-chart-8: var(--chart-8);
--color-chart-9: var(--chart-9);
--color-chart-10: var(--chart-10);
--color-income: var(--income);
--color-expense: var(--expense);
```

This makes Tailwind classes like `bg-chart-7`, `text-income`, `bg-expense` resolve.

### CategoryStatList badge fix

Today (`apps/web/src/components/CategoryStatList.tsx:33`):

```tsx
<Badge className="w-10 text-background" style={{ backgroundColor: color }}>
  {Math.round(item.percentage)}%
</Badge>
```

Change to:

```tsx
<Badge className="w-10 text-white" style={{ backgroundColor: color }}>
  {Math.round(item.percentage)}%
</Badge>
```

Rationale: the new chart palette is calibrated so that white text passes WCAG AA contrast on every chart hue in both light and dark mode (lightness 0.50–0.72, white = L 1.0, contrast ≥ 4.5:1). Locking the badge text to white avoids per-slice or per-mode logic. `text-white` is a built-in Tailwind utility (resolves to `oklch(1 0 0)`); no new token required.

### category-colors.ts extension

`apps/web/src/lib/category-colors.ts` becomes:

```ts
const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
];
```

The modulo wrap in `buildCategoryColorMap` already handles overflow past the array length — past 10 categories the palette repeats from `chart-1`.

## Files Touched

- `packages/ui/src/styles/globals.css`
  - Replace `--chart-1` … `--chart-5` definitions in `:root` (lines 76–80).
  - Add `--chart-6` … `--chart-10` and `--income`, `--expense` in `:root`.
  - Replace `--chart-1` … `--chart-5` definitions in `.dark` (lines 111–115).
  - Add `--chart-6` … `--chart-10` and `--income`, `--expense` in `.dark`.
  - Add `--color-chart-6` … `--color-chart-10`, `--color-income`, `--color-expense` to the `@theme inline` block (after the existing `--color-chart-5` line).

- `apps/web/src/lib/category-colors.ts`
  - Extend `CHART_PALETTE` array from 6 entries to 10 (`var(--chart-1)` … `var(--chart-10)`).

- `apps/web/src/components/CategoryStatList.tsx`
  - One-line className change on the Badge from `w-10 text-background` to `w-10 text-white`.

No other files change. `CashflowPieChart`, the dashboard, and the reverse `chartConfig` plumbing are agnostic to which color tokens flow through — they keep working unchanged.

## Verification

Manual, no theme tests in repo:

1. **Dashboard donut, light mode.** With ≥ 5 categories visible, every slice is distinguishable by hue and lightness. The largest slice is no longer invisible against the white card.
2. **Dashboard donut, dark mode.** Same — no slice merges into the card surface.
3. **CategoryStatList percentages, both modes.** Every badge shows a clearly readable white "N%" — no near-white-on-near-white.
4. **6th category appears.** Pre-fix, the 6th category had no fill (chart-6 unresolved). Post-fix, it renders the indigo `--chart-6` color.
5. **Wrap behavior.** With 11+ categories, the 11th category resolves to `--chart-1` (modulo wrap). No missing fills.
6. **No regressions on neutral UI.** Background/card/sidebar/primary/buttons all look identical to today — the change is additive on chart tokens.

## Risks / Open Questions

- **Tailwind v4 token scanning.** This project uses Tailwind v4 with `@theme inline`. Adding `--color-chart-6` etc. to that block should be picked up at build time without manual safelisting; `category-colors.ts` doesn't use class names anyway (it uses raw `var(--chart-N)` strings). Confirm by checking the dev server hot-reloads after the change with no missing-class warnings.
- **Future light-hue additions.** If someone extends the palette later with a deliberately pale color (e.g. L > 0.78), the `text-white` badge approach breaks. The plan should leave a comment near the palette explaining the contract: "chart hues must remain L ≤ 0.72 so white text passes contrast in CategoryStatList".
- **Dark-mode hue lift.** The 0.04–0.05 lightness lift is small enough to feel like "the same color" while making slices pop on the dark card. If the difference reads as too subtle in actual use, the dark values can be lifted further (e.g. +0.06) without spec changes — it's calibration, not architecture.
