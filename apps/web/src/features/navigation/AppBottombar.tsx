import React, { useRef } from "react";
import { PlusIcon } from "lucide-react";
import {
  linkOptions,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

import { NavItem } from "./NavItem";
import { PRIMARY_NAVIGATION_OPTIONS } from "./constants";
import { useUiActions } from "@/hooks/use-ui-store";

export function AppBottombar() {
  const router = useRouterState();
  const navigate = useNavigate();
  const currentPath = router.location.pathname;
  const navRef = useRef(null);
  const { setOpenCreateTransaction } = useUiActions();

  return (
    <div
      ref={navRef}
      className="justify-even fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 content-center items-center gap-4 transition-transform duration-200 ease-in-out md:hidden"
      id="app-bottom-bar"
    >
      <nav className="flex items-center justify-between gap-6 rounded-full bg-primary p-2 shadow-lg">
        {PRIMARY_NAVIGATION_OPTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.path}>
              <NavItem
                icon={<Icon />}
                isActive={currentPath === item.path}
                label={item.title}
                onClick={() =>
                  navigate(
                    linkOptions({
                      to: item.path,
                    })
                  )
                }
              />
            </React.Fragment>
          );
        })}
      </nav>
      <div className="rounded-full bg-primary p-2 shadow-lg">
        <NavItem
          icon={<PlusIcon />}
          isActive={false}
          label="Add transaction"
          onClick={() => setOpenCreateTransaction(true)}
        />
      </div>
    </div>
  );
}
