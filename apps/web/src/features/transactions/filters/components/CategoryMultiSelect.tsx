import { useState } from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

export interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
  parentId?: string | null;
}

export interface CategoryMultiSelectProps {
  options: CategoryOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Render selected categories as inline removable pills next to the trigger (desktop) */
  showInlinePills?: boolean;
  disabled?: boolean;
}

export function CategoryMultiSelect({
  options,
  value,
  onChange,
  showInlinePills = true,
  disabled,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.id));
  const triggerLabel =
    selected.length === 0
      ? "Category"
      : selected.length === 1
        ? (selected[0]?.name ?? "Category")
        : `${selected[0]?.name} +${selected.length - 1}`;

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" disabled={disabled} className="h-8 gap-1 text-xs" data-testid="tx-filters-category-trigger">
              {triggerLabel}
              <ChevronDownIcon className="size-3 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search categories…"
              className="h-8 text-xs"
              data-testid="tx-filters-category-search"
            />
            <CommandList>
              <CommandEmpty>No categories.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isChecked = value.includes(opt.id);
                  return (
                    <CommandItem
                      key={opt.id}
                      value={opt.name}
                      onSelect={() => toggle(opt.id)}
                      className="text-xs"
                      data-testid={`tx-filters-category-option-${opt.id}`}
                    >
                      <CheckIcon
                        className={`mr-2 size-3 ${
                          isChecked ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {opt.icon ? `${opt.icon} ` : ""}
                      {opt.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showInlinePills &&
        selected.map((cat) => (
          <Badge
            key={cat.id}
            variant="secondary"
            className="h-6 gap-1 rounded-full px-2 text-[10px]"
          >
            {cat.name}
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              aria-label={`Remove ${cat.name}`}
              className="-mr-1 rounded hover:bg-muted"
              data-testid={`tx-filters-category-pill-remove-${cat.id}`}
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
    </div>
  );
}
