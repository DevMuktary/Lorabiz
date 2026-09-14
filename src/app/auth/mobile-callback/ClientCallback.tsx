"use client";

import { useEffect, useState } from "react";

export default function ClientCallback({
  deepLink,
  hasToken,
}: {
  deepLink: string;
  hasToken: boolean;
}) {
  const [activeLink, setActiveLink] = useState(deepLink);

  useEffect(() => {
    let isCancelled = false;

    async function triggerRedirect() {
      let finalLink = activeLink;
      if (!hasToken) {
        try {
          const res = await fetch("/api/auth/mobile/session-token");
          const data = await res.json();
          if (data?.token && !isCancelled) {
            finalLink = `lorabiz://auth/google-success?token=${encodeURIComponent(data.token)}`;
            setActiveLink(finalLink);
          }
        } catch {}
      }

      // Fast deep-link navigation to close in-app browser sheet
      window.location.replace(finalLink);

      const timer = setTimeout(() => {
        if (!isCancelled) {
          window.location.href = finalLink;
        }
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }

    triggerRedirect();

    return () => {
      isCancelled = true;
    };
  }, [hasToken, activeLink]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#FAF9F6",
        padding: 24,
        textAlign: "center",
      }}
    >
      <meta httpEquiv="refresh" content={`0;url=${activeLink}`} />
      <div
        style={{
          maxWidth: 400,
          background: "#FFFFFF",
          padding: "36px 28px",
          borderRadius: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "rgba(200, 45, 117, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            color: "#C82D75",
            fontSize: 26,
            fontWeight: "bold",
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
          Authentication Successful
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 1.5 }}>
          Redirecting you back to the LoraBiz app... If the app does not open automatically, tap the button below.
        </p>
        <a
          href={activeLink}
          style={{
            display: "inline-block",
            backgroundColor: "#C82D75",
            color: "#FFFFFF",
            padding: "14px 28px",
            borderRadius: 14,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 15,
            boxShadow: "0 4px 14px rgba(200, 45, 117, 0.3)",
          }}
        >
          Open LoraBiz App
        </a>
      </div>
    </div>
  );
}
