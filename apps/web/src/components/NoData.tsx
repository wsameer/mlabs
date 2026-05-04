import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { RabbitIcon } from "lucide-react";

export function NoData() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="h-auto w-10 p-2">
          <RabbitIcon className="size-6" />
        </EmptyMedia>
        <EmptyTitle>No Data Available</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
