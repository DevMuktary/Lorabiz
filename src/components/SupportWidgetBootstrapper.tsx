"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Headset } from "@phosphor-icons/react";

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

function DraggableSupportBubble({ isVisible }: { isVisible: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const draggingRef = useRef<{
    isDragging: boolean;
    hasMoved: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("lora_draggable_support_pos_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const maxX = window.innerWidth - 64;
          const maxY = window.innerHeight - 64;
          setPos({
            x: Math.max(10, Math.min(maxX, parsed.x)),
            y: Math.max(10, Math.min(maxY, parsed.y)),
          });
          return;
        }
      }
    } catch {}
    // Default position: bottom-right corner, safe from bottom docks
    const defaultX = typeof window !== "undefined" ? window.innerWidth - 76 : 300;
    const defaultY = typeof window !== "undefined" ? window.innerHeight - 100 : 500;
    setPos({ x: Math.max(10, defaultX), y: Math.max(10, defaultY) });
  }, []);

  if (!mounted || !isVisible || !pos || typeof document === "undefined") return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current = {
      isDragging: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current.isDragging) return;
    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;

    if (!draggingRef.current.hasMoved && Math.hypot(dx, dy) > 6) {
      draggingRef.current.hasMoved = true;
    }

    if (draggingRef.current.hasMoved) {
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      const newX = Math.max(10, Math.min(maxX, draggingRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(maxY, draggingRef.current.initialY + dy));
      setPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current.isDragging) return;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    const wasMoved = draggingRef.current.hasMoved;
    draggingRef.current.isDragging = false;

    if (wasMoved) {
      try {
        localStorage.setItem("lora_draggable_support_pos_v2", JSON.stringify(pos));
      } catch {}
    } else {
      // Tap / Click action -> Open Chatwoot
      if (window.$chatwoot) {
        window.$chatwoot.toggle();
      } else {
        window.open("https://whatsapp.com/channel/0029VbDVwWbFnSz6VvpMKl3M", "_blank");
      }
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 999999,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="select-none cursor-grab active:cursor-grabbing group animate-in fade-in duration-300"
      title="Drag to reposition · Tap to chat with support"
    >
      <div className="relative flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-gradient-to-tr from-[#ff3f7a] to-[#d82a62] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white/25">
        <Headset size={26} weight="fill" className="drop-shadow-sm pointer-events-none" />
        
        {/* Pulse online green ring indicator */}
        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
        </span>
      </div>
    </div>,
    document.body
  );
}

export function SupportWidgetBootstrapper() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isDashboardRoute = Boolean(pathname?.startsWith("/dashboard"));

  const [supportConfig, setSupportConfig] = useState<{
    enabled: boolean;
    websiteToken: string;
    baseUrl: string;
  } | null>(null);

  // If outside the dashboard/portal, hide chatwoot if already loaded
  useEffect(() => {
    if (!isDashboardRoute && typeof window !== "undefined" && window.$chatwoot) {
      try {
        window.$chatwoot.toggle("close");
        window.$chatwoot.toggleBubbleVisibility("hide");
      } catch (e) {}
    }
  }, [isDashboardRoute]);

  // 1. Fetch runtime support configuration only for dashboard routes
  useEffect(() => {
    if (!isDashboardRoute) return;

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
  }, [isDashboardRoute]);

  // 2. Initialize Chatwoot SDK with hideMessageBubble: true (so our custom draggable bubble controls it)
  useEffect(() => {
    if (!isDashboardRoute || !supportConfig?.enabled || typeof window === "undefined") return;

    if (document.getElementById("chatwoot-sdk-script")) return;

    window.chatwootSettings = {
      hideMessageBubble: true,
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
  }, [isDashboardRoute, supportConfig]);

  // 3. Identify Logged-in User
  useEffect(() => {
    if (!isDashboardRoute || !supportConfig?.enabled || typeof window === "undefined") return;

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
  }, [isDashboardRoute, session, supportConfig]);

  if (!isDashboardRoute) return null;

  return <DraggableSupportBubble isVisible={Boolean(supportConfig?.enabled)} />;
}
