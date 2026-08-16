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
        <CardTitle className="text-xs text-muted-foreground uppercase tabular-nums">
          Main Goals (Mock data)
        </CardTitle>
        <CardAction>
          <Link
            className="rounded-md border px-2 py-1 text-primary hover:bg-secondary/80"
            to={"/goals"}
          >
            New goal
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-3">
          <Item size="xs" variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <ItemDescription className="cn-font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Retirement
              </ItemDescription>
              <div className="flex items-center-safe justify-between">
                <div className="flex gap-1">
                  <span className="text-sm font-light tabular-nums">
                    $273,000 of
                  </span>
                  <span className="text-sm font-medium tabular-nums">
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
          <Item size="xs" variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <ItemDescription className="cn-font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Real Estate
              </ItemDescription>
              <div className="flex items-center-safe justify-between">
                <div className="flex gap-1">
                  <span className="text-sm font-light tabular-nums">
                    $27,000 of
                  </span>
                  <span className="text-sm font-medium tabular-nums">
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
