"use client";

import { useEffect } from "react";
import { createNavigationState, cleanupNavigationState, preventLayoutShift, resetPageState } from "@/lib/utils";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle body classes to prevent hydration mismatches
  useEffect(() => {
    // Ensure the body has the correct classes
    const body = document.body;
    if (body) {
      // Remove any extension-added classes that might cause hydration issues
      const classesToRemove = ['vsc-initialized', 'vscode-initialized'];
      classesToRemove.forEach(className => {
        if (body.classList.contains(className)) {
          body.classList.remove(className);
        }
      });
      
      // Ensure antialiased class is present
      if (!body.classList.contains('antialiased')) {
        body.classList.add('antialiased');
      }
    }

    // Initialize navigation state
    createNavigationState();
    
    // Prevent layout shifts
    preventLayoutShift();

    // Cleanup on unmount
    return () => {
      cleanupNavigationState();
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reset page state when page becomes visible again
        resetPageState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle beforeunload to clean up state
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupNavigationState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
}
