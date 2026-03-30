import { useLayoutConfig } from "@/features/layout";
import { useTheme } from "@/components/ThemeProvider";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { Switch } from "@workspace/ui/components/switch";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  ChevronRightIcon,
  HeartIcon,
  LandmarkIcon,
  PiggyBankIcon,
  SendIcon,
  SunMoonIcon,
} from "lucide-react";

export function SettingsPage() {
  useLayoutConfig({
    pageTitle: "Settings",
  });

  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <Item
        variant="outline"
        className="items-center"
        size="sm"
        render={
          <button type="button">
            <ItemMedia>
              <Avatar className="size-9">
                <AvatarImage src="https://github.com/evilrabbit.png" />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-base">John Doe</ItemTitle>
              <ItemDescription>View personal details.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </button>
        }
      />

      <Card className="w-full max-w-sm p-0">
        <CardContent className="p-0">
          <Item
            size="xs"
            render={
              <button className="rounded-none outline-none hover:bg-muted">
                <ItemMedia variant="icon">
                  <BanknoteArrowUpIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Income Category Setting</ItemTitle>
                </ItemContent>
              </button>
            }
          />

          <Item
            size="xs"
            render={
              <button className="rounded-none outline-none hover:bg-muted">
                <ItemMedia variant="icon">
                  <BanknoteArrowDownIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Expense Category Setting</ItemTitle>
                </ItemContent>
              </button>
            }
          />

          <Item
            size="xs"
            render={
              <button className="rounded-none outline-none hover:bg-muted">
                <ItemMedia variant="icon">
                  <LandmarkIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Account Setting</ItemTitle>
                </ItemContent>
              </button>
            }
          />

          <Item
            size="xs"
            render={
              <button className="rounded-none outline-none hover:bg-muted">
                <ItemMedia variant="icon">
                  <PiggyBankIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Budget Setting</ItemTitle>
                </ItemContent>
              </button>
            }
          />
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm p-0">
        <CardContent className="p-0">
          <Field orientation="horizontal" className="gap-2.5 px-2.5 py-2">
            <SunMoonIcon className="size-4" />
            <FieldContent>
              <FieldLabel htmlFor="switch-focus-mode">Appearance</FieldLabel>
              <FieldDescription>
                Toggle dark theme for the interface
              </FieldDescription>
            </FieldContent>
            <Switch
              id="switch-focus-mode"
              checked={theme === "dark"}
              onCheckedChange={(value) => setTheme(value ? "dark" : "light")}
            />
          </Field>

          <Item
            size="xs"
            render={
              <button className="rounded-none outline-none hover:bg-muted">
                <ItemMedia variant="icon">
                  <HeartIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Rate it</ItemTitle>
                </ItemContent>
              </button>
            }
          />

          <Item
            size="xs"
            render={
              <button className="rounded-none outline-none hover:bg-muted">
                <ItemMedia variant="icon">
                  <SendIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Feedback</ItemTitle>
                </ItemContent>
              </button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
