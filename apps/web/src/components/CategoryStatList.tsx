import type { CategoryTotal } from "@workspace/types";
import { Badge } from "@workspace/ui/components/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";

export const CategoryStatList = ({
  data,
}: {
  data: CategoryTotal[];
}) => {
  if (!data.length) return null;

  return (
    <div className="my-4 flex flex-col gap-1">
      {data.map((item) => (
        <Item
          variant="outline"
          size="xs"
          key={item.categoryId ?? "uncategorized"}
          render={
            <button type="button" className="w-full">
              <ItemMedia>
                <Badge className="w-[48px]" variant="destructive">
                  {item.percentage}%
                </Badge>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {item.categoryIcon ? `${item.categoryIcon} ` : ""}
                  {item.categoryName}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  ${Number(item.total).toLocaleString()}
                </p>
              </ItemActions>
            </button>
          }
        />
      ))}
    </div>
  );
};
