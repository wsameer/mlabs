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
  data: {
    id: number;
    category: string;
    weight: string;
    value: number;
  }[];
}) => {
  return (
    <div className="my-4 flex flex-col gap-1">
      {data.map((item) => (
        <Item
          variant="outline"
          size="xs"
          key={item.id}
          render={
            <button type="button" className="w-full">
              <ItemMedia>
                <Badge className="w-[48px]" variant="destructive">
                  {item.weight}
                </Badge>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{item.category}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  ${item.value}
                </p>
              </ItemActions>
            </button>
          }
        />
      ))}
    </div>
  );
};
