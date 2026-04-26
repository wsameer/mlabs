import { FilterIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@workspace/ui/components/empty";

export interface FilteredEmptyProps {
  onReset: () => void;
}

export function FilteredEmpty({ onReset }: FilteredEmptyProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FilterIcon />
        </EmptyMedia>
        <EmptyTitle>No transactions match these filters</EmptyTitle>
        <EmptyDescription>
          Try broadening your search or clearing a filter.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}
