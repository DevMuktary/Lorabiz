import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

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

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 
        Changed min-h-screen to min-h-[100dvh] to fix the Safari toolbar bug
        Removed overscroll-none to allow the toolbar to collapse on scroll
      */}
      <body className={`${jetbrainsMono.className} ${jetbrainsMono.variable} antialiased bg-slate-50 text-slate-900 min-h-[100dvh] flex flex-col`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
