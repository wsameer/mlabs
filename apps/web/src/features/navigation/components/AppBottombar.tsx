import React, { useRef, useState } from "react";
import { ChevronUpIcon, PlusIcon } from "lucide-react";
import {
  linkOptions,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

import { NavItem } from "./NavItem";
import { PRIMARY_NAVIGATION_OPTIONS } from "../constants";
import { useUiActions } from "@/hooks/use-ui-store";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@workspace/ui/lib/utils";

const VISIBLE_ITEMS_ON_MOBILE = 3;

export function AppBottombar() {
  const router = useRouterState();
  const navigate = useNavigate();
  const currentPath = router.location.pathname;
  const navRef = useRef(null);
  const { setOpenCreateTransaction } = useUiActions();
  const backendStatus = useAppStore((s) => s.backendStatus);
  const isBackendConnected = backendStatus === "connected";
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavigation = (itemPath: string) => {
    if (!isBackendConnected) return;
    setIsExpanded(false); // Collapse on navigation
    navigate(linkOptions({ to: itemPath }));
  };

  const handleAddTransaction = () => {
    if (!isBackendConnected) return;
    setOpenCreateTransaction(true);
  };

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  const visibleItems = PRIMARY_NAVIGATION_OPTIONS.slice(
    0,
    VISIBLE_ITEMS_ON_MOBILE
  );
  const hiddenItems = PRIMARY_NAVIGATION_OPTIONS.slice(VISIBLE_ITEMS_ON_MOBILE);
  const hasHiddenItems = hiddenItems.length > 0;

  return (
    <div
      ref={navRef}
      className="justify-even fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 content-center items-end gap-4 transition-transform duration-200 ease-in-out md:hidden"
      id="app-bottom-bar"
    >
      {/* Single nav bar that stretches upward when expanded */}
      <nav
        className={cn(
          "flex flex-col rounded-[40px] bg-secondary/80 backdrop-blur-xl p-2 shadow-lg transition-all duration-300 ease-in-out",
          {
            "rounded-[32px]": isExpanded,
            "rounded-[42px]": !isExpanded,
          }
        )}
      >
        {/* Expanded row - appears above, grows upward */}
        {hasHiddenItems && (
          <div
            className={cn(
              "flex w-full items-center justify-end gap-6 overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded ? "mb-1 max-h-16 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {hiddenItems.map((item) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.path}>
                  <NavItem
                    icon={<Icon />}
                    isActive={currentPath === item.path}
                    label={item.title}
                    onClick={() => handleNavigation(item.path)}
                    disabled={!isBackendConnected}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Main row - always visible */}
        <div className="flex items-center justify-between gap-6">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.path}>
                <NavItem
                  icon={<Icon />}
                  isActive={currentPath === item.path}
                  label={item.title}
                  onClick={() => handleNavigation(item.path)}
                  disabled={!isBackendConnected}
                />
              </React.Fragment>
            );
          })}

          {/* Chevron button to expand/collapse */}
          {hasHiddenItems && (
            <NavItem
              icon={
                <ChevronUpIcon
                  className={cn(
                    "transition-transform duration-300",
                    isExpanded ? "rotate-180" : "rotate-0"
                  )}
                />
              }
              isActive={false}
              label="More options"
              onClick={toggleExpansion}
              disabled={!isBackendConnected}
            />
          )}
        </div>
      </nav>

      {/* Add transaction button - stays separate */}
      <div className="rounded-full bg-secondary/80 backdrop-blur-xl p-2 shadow-lg">
        <NavItem
          icon={<PlusIcon />}
          isActive={false}
          label="Add transaction"
          onClick={handleAddTransaction}
          disabled={!isBackendConnected}
        />
      </div>
    </div>
  );
}
