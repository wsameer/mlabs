import { useGlobalSearch, useUiActions } from "@/hooks/use-ui-store";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@workspace/ui/components/command";

export function SearchDialog() {
  const isGlobalSearchOpen = useGlobalSearch();
  const { setGlobalSearch } = useUiActions();
  return (
    <CommandDialog open={isGlobalSearchOpen} onOpenChange={setGlobalSearch}>
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
