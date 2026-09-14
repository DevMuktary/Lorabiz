"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function MobileCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Attempt instant deep link redirect
    const deepLink = "lorabiz://auth/google-success";
    window.location.href = deepLink;
    
    const timer = setTimeout(() => {
      window.location.href = deepLink;
    }, 800);

    return () => clearTimeout(timer);
  }, [status]);

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
          href="lorabiz://auth/google-success"
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
