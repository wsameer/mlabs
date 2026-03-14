import { SearchIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@workspace/ui/components/input-group";
import { Kbd } from "@workspace/ui/components/kbd";

export const Route = createFileRoute("/404")({
  component: NotFoundComponent,
});

export function NotFoundComponent() {
  return (
    <Empty className="mt-20">
      <EmptyHeader>
        <EmptyTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">
          404 - Not Found
        </EmptyTitle>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist. Try searching for
          what you need below.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <InputGroup className="sm:w-3/4">
          <InputGroupInput placeholder="Try searching for pages..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <EmptyDescription>
          Need help? <a href="#">Contact support</a>
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
}
