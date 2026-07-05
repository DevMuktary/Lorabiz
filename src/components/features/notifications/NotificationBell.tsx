"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  createdAt: string;
  read: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "System Ready",
      message: "Welcome to your LoraBiz dashboard. Your portal is active.",
      type: "info",
      createdAt: "Just now",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative select-none">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
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
          {/* Backdrop to close when clicked outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
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
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs font-medium">
                  No notifications to display.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
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
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-foreground truncate">{n.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{n.createdAt}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                    <button
                      onClick={(e) => clearNotification(n.id, e)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition-colors"
                    >
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
