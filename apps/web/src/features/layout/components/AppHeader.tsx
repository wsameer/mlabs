import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { useAppStore } from "@/lib/store";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export const AppHeader = () => {
  const navigate = useNavigate();
  const pageTitle = useAppStore((state) => state.headerTitle);
  const mobileBackPath = useAppStore((state) => state.mobileBackPath);

  const handleBack = () => {
    if (mobileBackPath) {
      navigate({ to: mobileBackPath });
    }
  };

  const renderDesktopHeader = () => (
    <div className="hidden md:flex md:items-center">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mt-1 mr-2 data-[orientation=vertical]:h-4"
      />
      <p className="text-base text-muted-foreground">{pageTitle}</p>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="flex w-full items-center gap-3 md:hidden">
      {mobileBackPath && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-5" />
        </Button>
      )}
      <h4 className="flex-1 scroll-m-20 text-lg font-semibold tracking-wide">
        {pageTitle}
      </h4>
    </div>
  );

  return (
    <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background p-4">
      {renderDesktopHeader()}
      {renderMobileHeader()}
    </header>
  );
};
