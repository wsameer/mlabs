import { TagsIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

export function CategoriesSection() {
  return (
    <div className="flex flex-col gap-5">
      <Empty className="rounded-xl border-none py-16 md:rounded-lg md:border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TagsIcon />
          </EmptyMedia>
          <EmptyTitle>Categories</EmptyTitle>
          <EmptyDescription>
            Manage your income and expense categories. Coming soon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
