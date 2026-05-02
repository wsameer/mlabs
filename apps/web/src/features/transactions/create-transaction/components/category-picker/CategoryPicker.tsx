import { useMemo, useState } from "react";
import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";

import type { Category, CategoryWithSubcategories } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

import { CategoryGrid } from "./CategoryGrid";
import type { PickerStage, PickerValue } from "./types";

interface CategoryPickerProps {
  id: string;
  label: string;
  categories: (Category | CategoryWithSubcategories)[] | undefined;
  value: PickerValue | null;
  onChange: (value: PickerValue) => void;
  error?: string;
  disabled?: boolean;
  testId?: string;
}

function flatten(
  input: (Category | CategoryWithSubcategories)[] | undefined
): Category[] {
  if (!input) return [];
  const out: Category[] = [];
  for (const node of input) {
    const { subcategories, ...rest } = node as CategoryWithSubcategories;
    out.push(rest as Category);
    if (subcategories?.length) {
      for (const sub of subcategories) out.push(sub);
    }
  }
  return out;
}

export function CategoryPicker({
  id,
  label,
  categories,
  value,
  onChange,
  error,
  disabled,
  testId,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<PickerStage>("parent");
  const [parentDraft, setParentDraft] = useState<Category | null>(null);

  const list = useMemo(() => flatten(categories), [categories]);

  const parents = useMemo(() => list.filter((c) => !c.parentId), [list]);

  const childrenOf = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of list) {
      if (c.parentId) {
        const bucket = map.get(c.parentId) ?? [];
        bucket.push(c);
        map.set(c.parentId, bucket);
      }
    }
    return map;
  }, [list]);

  const hasChildrenMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const [parentId, kids] of childrenOf) {
      if (kids.length > 0) map[parentId] = true;
    }
    return map;
  }, [childrenOf]);

  const selectedParent = value
    ? (list.find((c) => c.id === value.categoryId) ?? null)
    : null;
  const selectedSub =
    value?.subcategoryId != null
      ? (list.find((c) => c.id === value.subcategoryId) ?? null)
      : null;

  const stageParent = stage === "subcategory" ? parentDraft : null;
  const subcategories = stageParent
    ? (childrenOf.get(stageParent.id) ?? [])
    : [];

  function resetToInitialStage() {
    setStage("parent");
    setParentDraft(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetToInitialStage();
  }

  function handleParentSelect(parent: Category) {
    const kids = childrenOf.get(parent.id) ?? [];
    if (kids.length === 0) {
      onChange({ categoryId: parent.id });
      handleOpenChange(false);
      return;
    }
    setParentDraft(parent);
    setStage("subcategory");
  }

  function handleSubSelect(sub: Category) {
    if (!parentDraft) return;
    onChange({ categoryId: parentDraft.id, subcategoryId: sub.id });
    handleOpenChange(false);
  }

  function handleBack() {
    setStage("parent");
    setParentDraft(null);
  }

  const triggerLabel = selectedParent
    ? `${selectedParent.icon ? `${selectedParent.icon} ` : ""}${selectedParent.name}${
        selectedSub ? ` · ${selectedSub.name}` : ""
      }`
    : "Select category";

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              data-testid={testId}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn(
                "h-9 w-full justify-between px-3 text-xs font-normal",
                !selectedParent && "text-muted-foreground"
              )}
            >
              <span className="truncate">{triggerLabel}</span>
              <ChevronDownIcon className="size-3 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[var(--anchor-width)] max-w-[var(--anchor-width)] gap-2 p-2"
        >
          <div className="flex items-center gap-1 px-1 pb-1">
            {stage === "subcategory" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleBack}
                aria-label="Back to categories"
                data-testid={testId ? `${testId}-back` : undefined}
              >
                <ChevronLeftIcon />
              </Button>
            )}
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {stage === "parent" ? (
                "Category"
              ) : (
                <>
                  Subcategory of{" "}
                  <span className="text-foreground">
                    {stageParent?.name ?? ""}
                  </span>
                </>
              )}
            </span>
          </div>
          {stage === "parent" ? (
            <CategoryGrid
              items={parents}
              hasChildrenMap={hasChildrenMap}
              selectedId={selectedParent?.id}
              onSelect={handleParentSelect}
              testIdPrefix={testId ? `${testId}-parent` : undefined}
            />
          ) : (
            <CategoryGrid
              items={subcategories}
              selectedId={selectedSub?.id}
              onSelect={handleSubSelect}
              onBack={handleBack}
              testIdPrefix={testId ? `${testId}-sub` : undefined}
            />
          )}
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
