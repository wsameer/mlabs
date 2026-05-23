import { Link } from "@tanstack/react-router";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@workspace/ui/components/item";
import { Progress } from "@workspace/ui/components/progress";

export function MainGoals() {
  // TODO
  // add a query to fetch goals or else show empty goals

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Main Goals</CardTitle>
        <CardAction>
          <Link
            className="rounded-md bg-primary px-2 py-1 text-[10px] text-primary-foreground hover:bg-primary/80"
            to={"/goals"}
          >
            New goal
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-3">
          <Item size="sm" variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <ItemDescription className="cn-font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Retirement
              </ItemDescription>
              <div className="flex items-center-safe justify-between">
                <div className="flex gap-1">
                  <span className="text-sm font-normal tabular-nums">
                    $273,000 of
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    $420,000
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  65% achieved
                </span>
              </div>
              <Progress value={65} />
            </ItemContent>
          </Item>
          <Item size="sm" variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <ItemDescription className="cn-font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Real Estate
              </ItemDescription>
              <div className="flex items-center-safe justify-between">
                <div className="flex gap-1">
                  <span className="text-sm font-normal tabular-nums">
                    $27,000 of
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    $83,000
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  32% achieved
                </span>
              </div>
              <Progress value={32} />
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
      <CardFooter>
        <CardDescription className="text-center">
          You have not met your targets for this year.
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
