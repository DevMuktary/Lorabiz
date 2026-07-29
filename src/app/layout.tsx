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
  metadataBase: new URL("https://lorabiz.com"), 
  title: {
    default: "LoraBiz | CAC Registration, NIN Slips, SCUML & Airtime",
    template: "%s | LoraBiz", 
  },
  description: "Automate your corporate journey with LoraBiz. Seamlessly register your CAC Business Name or LLC, process EFCC SCUML certificates, generate instant NIN slips, and purchase fast airtime. Powered by Quadrox Technologies Limited.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
};

// CRITICAL: themeColor MUST be removed from here so Providers.tsx can control it instantly
export const viewport: Viewport = {
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
        </Providers>
      </body>
    </html>
  );
}
