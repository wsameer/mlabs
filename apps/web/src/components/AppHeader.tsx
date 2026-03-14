import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export const AppHeader = () => {
  const renderDesktopHeader = () => (
    <div className="hidden md:flex md:items-center">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mt-1 mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inbox</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="flex w-full items-center gap-3 md:hidden">
      <h4 className="flex-1 scroll-m-20 text-lg font-semibold tracking-wide">
        Dashboard
      </h4>
    </div>
  );

  return (
    <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
      {renderDesktopHeader()}
      {renderMobileHeader()}
    </header>
  );
};
