import type { CategoryTotal } from "@workspace/types";
import type { CategoryColorMap } from "@/lib/category-colors";
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
  colorMap,
}: {
  data: CategoryTotal[];
  colorMap: CategoryColorMap;
}) => {
  if (!data.length) return null;

  return (
    <div className="flex flex-col gap-1">
      {data.map((item) => {
        const color = colorMap[item.categoryId ?? "uncategorized"];
        return (
          <Item
            variant="outline"
            size="xs"
            key={item.categoryId ?? "uncategorized"}
            render={
              <button type="button" className="w-full">
                <ItemMedia>
                  <Badge
                    className="w-10 text-foreground"
                    style={{ backgroundColor: color }}
                  >
                    {Math.round(item.percentage)}%
                  </Badge>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {item.categoryIcon ? `${item.categoryIcon} ` : ""}
                    {item.categoryName}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <p className="not-first:mt- leading-7">
                    ${Math.round(Number(item.total)).toLocaleString()}
                  </p>
                </ItemActions>
              </button>
            }
          />
        );
      })}
    </div>
  );
};
