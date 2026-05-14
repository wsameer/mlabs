import { Fragment } from "react";
import { useHeaderConfig } from "@/hooks/use-layout";
import { useUiActions } from "@/hooks/use-ui-store";
import type { Breadcrumb as BreadcrumbType } from "@/stores/slices/layout-slice";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

export const AppHeader = () => {
  const navigate = useNavigate();
  const {
    title: pageTitle,
    actions: headerActions,
    breadcrumbs,
    mobileBackPath,
    onMobileBack,
  } = useHeaderConfig();
  const { setGlobalSearch } = useUiActions();
  const crumbs: BreadcrumbType[] =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : [{ label: pageTitle }];
  const showBackButton = Boolean(mobileBackPath || onMobileBack);

  const handleBack = () => {
    if (onMobileBack) {
      onMobileBack();
    } else if (mobileBackPath) {
      navigate({ to: mobileBackPath });
    }
  };

  const renderDesktopHeader = () => (
    <div className="hidden md:flex md:items-center md:justify-between md:gap-2 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <Fragment key={`${c.label}-${i}`}>
                  <BreadcrumbItem>
                    {isLast || !c.to ? (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link to={c.to} />}>
                        {c.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="flex w-full items-center justify-between gap-3 px-3 md:hidden">
      <div className="flex gap-1">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
        )}
        <h4 className="flex-1 scroll-m-20 text-xl font-medium tracking-wide">
          {pageTitle}
        </h4>
      </div>
      <div className="flex gap-1">
        {headerActions}
        <Button
          onClick={() => setGlobalSearch(true)}
          variant="outline"
          size="sm"
          aria-label="Search"
        >
          <SearchIcon className="size-4" />
          <span className="text-xs text-muted-foreground">⌘K</span>
        </Button>
      </div>
    </div>
  );

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {renderDesktopHeader()}
      {renderMobileHeader()}
    </header>
  );
};
