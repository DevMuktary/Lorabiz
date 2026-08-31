"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export function SupportWidgetBootstrapper() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [websiteId, setWebsiteId] = useState<string | null>(null);

  // 1. Fetch runtime config
  useEffect(() => {
    fetch("/api/config/support")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.websiteId) {
          setWebsiteId(data.websiteId);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Initialize Crisp SDK
  useEffect(() => {
    if (!websiteId || typeof window === "undefined") return;

    if (document.getElementById("crisp-sdk-script")) return;

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement("script");
    script.id = "crisp-sdk-script";
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;

    document.head.appendChild(script);
  }, [websiteId]);

  // 3. Route-based visibility: Hide on Register/Complete-profile, Show on Dashboard/Login/Home
  useEffect(() => {
    if (!websiteId || typeof window === "undefined" || !window.$crisp) return;

    const isRegisterRoute = 
      pathname === "/auth/register" || 
      pathname === "/auth/complete-profile";

    try {
      if (isRegisterRoute) {
        window.$crisp.push(["do", "chat:hide"]);
      } else {
        window.$crisp.push(["do", "chat:show"]);
      }
    } catch (e) {}
  }, [pathname, websiteId]);

  // 4. Identify Logged-in User
  useEffect(() => {
    if (!websiteId || typeof window === "undefined" || !window.$crisp) return;

    if (session?.user) {
      try {
        if (session.user.email) {
          window.$crisp.push(["set", "user:email", [session.user.email]]);
        }
        if (session.user.name) {
          window.$crisp.push(["set", "user:nickname", [session.user.name]]);
        }
        if (session.user.image) {
          window.$crisp.push(["set", "user:avatar", [session.user.image]]);
        }
        if ((session.user as any).id) {
          window.$crisp.push([
            "set",
            "session:data",
            [[["user_id", (session.user as any).id]]],
          ]);
        }
      } catch (e) {}
    }
  }, [session, websiteId]);

  return null;
}



