import { Button } from "@workspace/ui/components/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const DateRangeFilter = () => {
  return (
    <div className="flex content-center items-center justify-between">
      <Button variant="outline" size="icon" aria-label="Submit">
        <ChevronLeftIcon />
      </Button>
      <p className="text-sm text-muted-foreground">March 2026</p>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ChevronRightIcon />
      </Button>
    </div>
  );
};
