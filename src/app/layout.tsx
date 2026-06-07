import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Configure the JetBrains Mono font from your Lyra preset
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumebiz | Business Registration Made Easy",
  description: "Seamlessly register and manage your business. Powered by Quadrox Technologies Limited.",
  icons: {
    icon: "/favicon.ico",
  },
};

// THIS FIXES THE SAFARI URL BAR BUG
export const viewport: Viewport = {
  themeColor: "#f8fafc", // Hex code for slate-50
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents auto-zooming on inputs in Safari
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${jetbrainsMono.className} ${jetbrainsMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
