import { Fragment } from "react";
import { ArrowLeftIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

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
    <div className="hidden w-full md:flex md:items-center md:justify-between">
      <div className="flex items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mt-1 mr-2 data-[orientation=vertical]:h-4"
        />
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList className="text-base">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${i}`}>
                    <BreadcrumbItem>
                      {isLast || !crumb.to ? (
                        <BreadcrumbPage className="text-muted-foreground">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          render={<Link to={crumb.to} />}
                          className="text-muted-foreground"
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
          <p className="text-base text-muted-foreground">{pageTitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" onClick={handleAddTransaction}>
          <PlusIcon /> Add Transaction
        </Button>
        <Button
          onClick={() => setGlobalSearch(true)}
          variant="outline"
          size="sm"
        >
          <SearchIcon data-icon="inline-start" />
          <p className="text-muted-foreground">⌘K</p>
        </Button>
        {headerActions}
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
        >
          <SearchIcon data-icon="inline-start" />
          <p className="text-muted-foreground">⌘K</p>
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
