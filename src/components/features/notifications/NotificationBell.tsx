"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  link?: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // 1. Fetch live notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Poll every 60 seconds for background updates
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 2. Mark as read on backend when opening bell
  const handleToggle = async () => {
    const opening = !isOpen;
    setIsOpen(opening);

    if (opening && unreadCount > 0) {
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Tell backend to mark as read
      await fetch("/api/notifications", { method: "PATCH" });
    }
  };

  return (
    <div className="relative select-none">
      <button
        onClick={handleToggle}
        className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10 cursor-pointer focus:outline-none"
        aria-label="View Notifications"
      >
        <Bell className="h-5 w-5" weight="bold" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs font-medium">
                  No notifications to display.
                </div>
              ) : (
                notifications.map((n) => {
                  const Content = (
                    <div
                      className={`p-4 flex items-start gap-3 transition-colors ${
                        !n.read ? "bg-primary/5" : "hover:bg-secondary/20"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-500" weight="fill" />}
                        {n.type === "warning" && <WarningCircle className="h-5 w-5 text-amber-500" weight="fill" />}
                        {n.type === "info" && <Info className="h-5 w-5 text-primary" weight="fill" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setIsOpen(false)}>
                      {Content}
                    </Link>
                  ) : (
                    <div key={n.id}>{Content}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
