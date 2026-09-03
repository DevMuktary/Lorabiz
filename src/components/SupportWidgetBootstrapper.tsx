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

  // 5. Make the Support Launcher Bubble Draggable (Desktop & Mobile)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanup: (() => void) | null = null;

    const initDraggable = () => {
      const bubble = (
        document.querySelector(".woot--bubble-holder") ||
        document.querySelector(".woot-widget-bubble") ||
        document.querySelector("#chatwoot_live_chat_widget")
      ) as HTMLElement | null;

      if (!bubble || (bubble as any).__isDraggableInitialized) return;
      (bubble as any).__isDraggableInitialized = true;

      bubble.style.touchAction = "none";
      bubble.style.cursor = "grab";
      bubble.style.userSelect = "none";

      // Restore position if previously dragged
      try {
        const savedPos = sessionStorage.getItem("lora_support_pos");
        if (savedPos) {
          const { x, y } = JSON.parse(savedPos);
          if (typeof x === "number" && typeof y === "number") {
            const maxX = window.innerWidth - (bubble.offsetWidth || 60) - 10;
            const maxY = window.innerHeight - (bubble.offsetHeight || 60) - 10;
            const safeX = Math.max(10, Math.min(maxX, x));
            const safeY = Math.max(10, Math.min(maxY, y));
            bubble.style.position = "fixed";
            bubble.style.left = `${safeX}px`;
            bubble.style.top = `${safeY}px`;
            bubble.style.right = "auto";
            bubble.style.bottom = "auto";
          }
        }
      } catch (e) {}

      let isDragging = false;
      let hasMoved = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      const onStart = (clientX: number, clientY: number) => {
        const rect = bubble.getBoundingClientRect();
        startX = clientX;
        startY = clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        hasMoved = false;
        isDragging = true;
        bubble.style.cursor = "grabbing";
        bubble.style.transition = "none";
      };

      const onMove = (clientX: number, clientY: number, e: Event) => {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;

        if (!hasMoved && Math.hypot(dx, dy) > 5) {
          hasMoved = true;
        }

        if (hasMoved) {
          if (e.cancelable) e.preventDefault();
          const bubbleWidth = bubble.offsetWidth || 60;
          const bubbleHeight = bubble.offsetHeight || 60;
          const maxX = window.innerWidth - bubbleWidth - 10;
          const maxY = window.innerHeight - bubbleHeight - 10;

          const newX = Math.max(10, Math.min(maxX, initialLeft + dx));
          const newY = Math.max(10, Math.min(maxY, initialTop + dy));

          bubble.style.position = "fixed";
          bubble.style.left = `${newX}px`;
          bubble.style.top = `${newY}px`;
          bubble.style.right = "auto";
          bubble.style.bottom = "auto";
        }
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        bubble.style.cursor = "grab";
        bubble.style.transition = "";

        if (hasMoved) {
          const rect = bubble.getBoundingClientRect();
          try {
            sessionStorage.setItem("lora_support_pos", JSON.stringify({ x: rect.left, y: rect.top }));
          } catch (e) {}

          // Suppress accidental click/open event caused by dragging
          const blockClick = (ev: MouseEvent) => {
            ev.stopPropagation();
            ev.preventDefault();
            bubble.removeEventListener("click", blockClick, true);
          };
          bubble.addEventListener("click", blockClick, true);
          setTimeout(() => {
            bubble.removeEventListener("click", blockClick, true);
          }, 100);
        }
      };

      // Mouse handlers
      const handleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        onStart(e.clientX, e.clientY);

        const handleMouseMove = (ev: MouseEvent) => onMove(ev.clientX, ev.clientY, ev);
        const handleMouseUp = () => {
          onEnd();
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: false });
        window.addEventListener("mouseup", handleMouseUp, { once: true });
      };

      // Touch handlers
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        onStart(touch.clientX, touch.clientY);

        const handleTouchMove = (ev: TouchEvent) => {
          if (ev.touches.length !== 1) return;
          const t = ev.touches[0];
          onMove(t.clientX, t.clientY, ev);
        };

        const handleTouchEnd = () => {
          onEnd();
          window.removeEventListener("touchmove", handleTouchMove);
          window.removeEventListener("touchend", handleTouchEnd);
          window.removeEventListener("touchcancel", handleTouchEnd);
        };

        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd, { once: true });
        window.addEventListener("touchcancel", handleTouchEnd, { once: true });
      };

      bubble.addEventListener("mousedown", handleMouseDown);
      bubble.addEventListener("touchstart", handleTouchStart, { passive: true });

      cleanup = () => {
        bubble.removeEventListener("mousedown", handleMouseDown);
        bubble.removeEventListener("touchstart", handleTouchStart);
      };
    };

    const interval = setInterval(initDraggable, 1000);
    const observer = new MutationObserver(initDraggable);
    observer.observe(document.body, { childList: true, subtree: true });

    initDraggable();

    return () => {
      clearInterval(interval);
      observer.disconnect();
      if (cleanup) cleanup();
    };
  }, [pathname]);

  return null;
}
