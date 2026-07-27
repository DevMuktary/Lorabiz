import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SupportWidgetBootstrapper } from "@/components/SupportWidgetBootstrapper"; // <-- ADD THIS IMPORT
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
      <body className={`${jetbrainsMono.className} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-[100dvh] flex flex-col transition-colors duration-300`}>
        <Providers>
          {children}
          <SupportWidgetBootstrapper /> {/* <-- ADD THIS LINE HERE */}
        </Providers>
      </body>
    </html>
  );
}
