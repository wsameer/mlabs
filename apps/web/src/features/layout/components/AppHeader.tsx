import { Fragment } from "react";
import { ArrowLeftIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { TeamSwitcher } from "@/features/navigation/components/TeamSwitcher";
import { Button } from "@workspace/ui/components/button";
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
import { useHeaderConfig } from "@/hooks/use-layout";
import { useUiActions } from "@/hooks/use-ui-store";
import { useAppStore } from "@/stores";

export const AppHeader = () => {
  const navigate = useNavigate();
  const {
    title: pageTitle,
    actions: headerActions,
    breadcrumbs,
    mobileBackPath,
    onMobileBack,
  } = useHeaderConfig();
  const { setGlobalSearch, setOpenCreateTransaction } = useUiActions();
  const showBackButton = Boolean(mobileBackPath || onMobileBack);
  const backendStatus = useAppStore((s) => s.backendStatus);
  const isBackendConnected = backendStatus === "connected";

  const handleAddTransaction = () => {
    if (!isBackendConnected) return;
    setOpenCreateTransaction(true);
  };

  const handleBack = () => {
    if (onMobileBack) {
      onMobileBack();
    } else if (mobileBackPath) {
      navigate({ to: mobileBackPath });
    }
  };

  const renderDesktopHeader = () => (
    <div className="hidden w-full md:flex md:items-center md:justify-between md:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${i}`}>
                    <BreadcrumbItem>
                      {isLast || !crumb.to ? (
                        <BreadcrumbPage className="font-medium text-foreground">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          render={<Link to={crumb.to} />}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="truncate text-sm font-medium text-foreground">
            {pageTitle}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {headerActions}
        <Button
          onClick={() => setGlobalSearch(true)}
          variant="outline"
          size="sm"
          aria-label="Search"
        >
          <SearchIcon data-icon="inline-start" />
          <p className="text-muted-foreground">⌘K</p>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleAddTransaction}
          disabled={!isBackendConnected}
          className="gap-1.5"
        >
          <PlusIcon className="size-4" />
          <span className="hidden lg:inline">Add Transaction</span>
          <span className="lg:hidden">Add</span>
        </Button>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-6"
        />
        <TeamSwitcher />
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="flex w-full items-center justify-between gap-3 md:hidden">
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
    <header className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b bg-background p-3">
      {renderDesktopHeader()}
      {renderMobileHeader()}
    </header>
  );
};
