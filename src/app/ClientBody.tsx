"use client";

import { useEffect } from "react";

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
  }, []);

  return <>{children}</>;
}
