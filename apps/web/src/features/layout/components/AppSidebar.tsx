import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@workspace/ui/components/sidebar";
import { AppLeftSideNav } from "@/features/navigation";
import { useSidebarLeftContent } from "@/hooks/use-layout";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarLeftContent = useSidebarLeftContent();

  const navRef = React.useRef(null);

  return (
    <Sidebar
      side="left"
      collapsible="icon"
      ref={navRef}
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <AppLeftSideNav />

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">mLabs</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>{sidebarLeftContent}</SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
