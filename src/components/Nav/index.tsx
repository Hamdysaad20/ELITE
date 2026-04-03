"use client";

import { useRef } from "react";
import DesktopHeader from "./DesktopHeader";
import MobileTopBar from "./MobileTopBar";
import Drawer from "./Drawer";
import BottomNav from "./BottomNav";
import { useNavState } from "./hooks/useNavState";

export default function Nav() {
  const state = useNavState();
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Desktop + tablet header (≥641px) */}
      <DesktopHeader auth={state.auth} />

      {/* Mobile top bar (≤640px) */}
      <MobileTopBar
        auth={state.auth}
        drawerOpen={state.drawerOpen}
        onOpenDrawer={state.openDrawer}
        hamburgerRef={hamburgerRef}
      />

      {/* Mobile drawer */}
      <Drawer
        open={state.drawerOpen}
        onClose={state.closeDrawer}
        auth={state.auth}
        hamburgerRef={hamburgerRef}
      />

      {/* Mobile bottom nav (≤640px) */}
      <BottomNav auth={state.auth} />
    </>
  );
}
