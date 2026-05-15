import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { NavMain } from "@/features/navigation";
import { TeamSwitcher } from "@/features/navigation/components/TeamSwitcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navRef = React.useRef(null);

  return (
    <Sidebar variant="inset" collapsible="icon" ref={navRef} {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
