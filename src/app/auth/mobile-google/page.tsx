"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function MobileGoogleAuthPage() {
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!hasTriggered) {
      setHasTriggered(true);
      signIn("google", { callbackUrl: "/auth/mobile-callback" });
    }
  }, [hasTriggered]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF9F6",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          border: "3.5px solid rgba(200, 45, 117, 0.15)",
          borderTopColor: "#C82D75",
          animation: "spin 0.9s linear infinite",
          marginBottom: 20,
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#0F172A",
          margin: "0 0 8px",
          letterSpacing: "-0.3px",
        }}
      >
        Connecting to Google
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "#64748B",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        Redirecting securely to Google authentication...
      </p>

      {/* Manual Fallback in case browser script execution is delayed */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/auth/mobile-callback" })}
        style={{
          backgroundColor: "#FFFFFF",
          color: "#0F172A",
          border: "1.5px solid #E2E8F0",
          padding: "12px 24px",
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        Tap if not redirected automatically
      </button>
    </div>
  );
}
