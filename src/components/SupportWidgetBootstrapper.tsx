"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export function SupportWidgetBootstrapper() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [config, setConfig] = useState<{ baseUrl: string; websiteToken: string; enabled: boolean } | null>(null);

  // 1. Fetch runtime config
  useEffect(() => {
    fetch("/api/config/chatwoot")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Initialize Chatwoot SDK
  useEffect(() => {
    if (!config?.enabled || !config.websiteToken || typeof window === "undefined") return;

    if (document.getElementById("chatwoot-sdk-script")) {
      if ((window as any).chatwootSDK && !(window as any).$chatwoot) {
        (window as any).chatwootSDK.run({
          websiteToken: config.websiteToken,
          baseUrl: config.baseUrl,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "chatwoot-sdk-script";
    script.src = `${config.baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if ((window as any).chatwootSDK) {
        (window as any).chatwootSDK.run({
          websiteToken: config.websiteToken,
          baseUrl: config.baseUrl,
        });
      }
    };

    document.head.appendChild(script);
  }, [config]);

  // 3. Route-based visibility: Hide on Register/Complete-profile, Show on Dashboard/Login/Home
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isRegisterRoute = 
      pathname === "/auth/register" || 
      pathname === "/auth/complete-profile";

    const applyVisibility = () => {
      const widget = document.querySelector(".woot-widget-holder") as HTMLElement | null;
      const bubble = document.querySelector(".woot--bubble-holder") as HTMLElement | null;
      
      if (isRegisterRoute) {
        if (widget) widget.style.display = "none";
        if (bubble) bubble.style.display = "none";
        try {
          (window as any).$chatwoot?.toggle?.("hide");
        } catch (e) {}
      } else {
        if (widget) {
          widget.style.display = "";
          widget.style.zIndex = "999999";
        }
        if (bubble) {
          bubble.style.display = "";
          bubble.style.zIndex = "999999";
        }
      }
    };

    applyVisibility();
    window.addEventListener("chatwoot:ready", applyVisibility);

    return () => {
      window.removeEventListener("chatwoot:ready", applyVisibility);
    };
  }, [pathname, config]);

  // 4. Identify Logged-in User
  useEffect(() => {
    if (!config?.enabled || typeof window === "undefined") return;

    const identifyUser = () => {
      if (session?.user && (window as any).$chatwoot) {
        try {
          (window as any).$chatwoot.setUser((session.user as any).id || session.user.email, {
            name: session.user.name || "",
            email: session.user.email || "",
            avatar_url: session.user.image || "",
          });
        } catch (e) {}
      }
    };

    window.addEventListener("chatwoot:ready", identifyUser);
    identifyUser();

    return () => {
      window.removeEventListener("chatwoot:ready", identifyUser);
    };
  }, [session, config]);

  // 5. Sync Dark/Light Mode
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).$chatwoot && resolvedTheme) {
      try {
        (window as any).$chatwoot.setDarkMode?.(resolvedTheme === "dark");
      } catch (e) {}
    }
  }, [resolvedTheme]);

  return null;
}


