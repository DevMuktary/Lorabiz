// src/components/UnregisterSW.tsx
"use client";

import { useEffect } from "react";

export default function UnregisterSW() {
  useEffect(() => {
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then(() => {
            console.log('Rogue Service Worker destroyed.');
          });
        }
      }).catch((err) => console.error("SW Cleanup failed", err));
    }
  }, []);

  return null;
}
