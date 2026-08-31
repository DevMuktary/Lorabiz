"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface ChatwootUserAttributes {
  name?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
  identifier_hash?: string;
}

interface ChatwootSDKInstance {
  setUser: (identifier: string, user: ChatwootUserAttributes) => void;
  setCustomAttributes: (attributes: Record<string, any>) => void;
  deleteCustomAttribute: (customAttribute: string) => void;
  setLocale: (locale: string) => void;
  setText: (text: string) => void;
  toggle: (state?: "open" | "close") => void;
  toggleBubbleVisibility: (visibility: "show" | "hide") => void;
  popoutChatWindow: () => void;
  reset: () => void;
}

declare global {
  interface Window {
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: "left" | "right";
      locale?: string;
      type?: "standard" | "expanded_bubble";
      darkMode?: "light" | "auto";
      launcherTitle?: string;
      showPopoutButton?: boolean;
      [key: string]: any;
    };
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: ChatwootSDKInstance;
  }
}

export function SupportWidgetBootstrapper() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [supportConfig, setSupportConfig] = useState<{
    enabled: boolean;
    websiteToken: string;
    baseUrl: string;
  } | null>(null);

  // 1. Fetch runtime support configuration
  useEffect(() => {
    fetch("/api/config/support")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.websiteToken) {
          setSupportConfig({
            enabled: true,
            websiteToken: data.websiteToken,
            baseUrl: data.baseUrl || "https://app.chatwoot.com",
          });
        }
      })
      .catch(() => {});
  }, []);

  // 2. Initialize Chatwoot SDK
  useEffect(() => {
    if (!supportConfig?.enabled || typeof window === "undefined") return;

    if (document.getElementById("chatwoot-sdk-script")) return;

    window.chatwootSettings = {
      position: "right",
      type: "standard",
      launcherTitle: "Chat with us",
      darkMode: "auto",
      showPopoutButton: true,
      ...window.chatwootSettings,
    };

    const script = document.createElement("script");
    script.id = "chatwoot-sdk-script";
    script.src = `${supportConfig.baseUrl}/packs/js/sdk.js`;
    script.async = true;

    script.onload = () => {
      if (window.chatwootSDK) {
        window.chatwootSDK.run({
          websiteToken: supportConfig.websiteToken,
          baseUrl: supportConfig.baseUrl,
        });
      }
    };

    document.head.appendChild(script);
  }, [supportConfig]);

  // 3. Route-based visibility: Hide on Register/Complete-profile, Show on Dashboard/Home
  useEffect(() => {
    if (!supportConfig?.enabled || typeof window === "undefined") return;

    const isRegisterRoute =
      pathname === "/auth/register" ||
      pathname === "/auth/complete-profile";

    const updateVisibility = () => {
      try {
        if (window.$chatwoot?.toggleBubbleVisibility) {
          window.$chatwoot.toggleBubbleVisibility(isRegisterRoute ? "hide" : "show");
        }
      } catch (e) {}
    };

    // If chatwoot is already initialized
    updateVisibility();

    // In case Chatwoot initializes asynchronously after route change
    window.addEventListener("chatwoot:ready", updateVisibility);
    return () => {
      window.removeEventListener("chatwoot:ready", updateVisibility);
    };
  }, [pathname, supportConfig]);

  // 4. Identify Logged-in User
  useEffect(() => {
    if (!supportConfig?.enabled || typeof window === "undefined") return;

    const syncUser = () => {
      try {
        if (!window.$chatwoot) return;

        if (session?.user) {
          const user = session.user as any;
          const identifier = user.id || user.email;

          if (identifier) {
            window.$chatwoot.setUser(String(identifier), {
              name: user.name || undefined,
              email: user.email || undefined,
              avatar_url: user.image || undefined,
            });

            window.$chatwoot.setCustomAttributes({
              user_id: user.id || undefined,
              role: user.role || undefined,
            });
          }
        }
      } catch (e) {}
    };

    syncUser();
    window.addEventListener("chatwoot:ready", syncUser);
    return () => {
      window.removeEventListener("chatwoot:ready", syncUser);
    };
  }, [session, supportConfig]);

  return null;
}




