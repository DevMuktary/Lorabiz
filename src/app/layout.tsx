import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Heavy SEO Configuration
export const metadata: Metadata = {
  metadataBase: new URL("https://lorabiz.com"), // Update this to your actual production domain when you launch
  title: {
    default: "LoraBiz | CAC Registration, NIN Slips, SCUML & Airtime",
    template: "%s | LoraBiz", 
  },
  description: "Automate your corporate journey with LoraBiz. Seamlessly register your CAC Business Name or LLC, process EFCC SCUML certificates, generate instant NIN slips, and purchase fast airtime. Powered by Quadrox Technologies Limited.",
  keywords: [
    "CAC registration Nigeria",
    "Business Name registration",
    "LLC incorporation Nigeria",
    "Company Registration CAC",
    "SCUML certificate EFCC",
    "Instant NIN slip generation",
    "NIMC verified partner",
    "Buy cheap airtime Nigeria",
    "Quadrox Technologies Limited",
    "LoraBiz dashboard",
    "Corporate Affairs Commission portal"
  ],
  authors: [{ name: "Quadrox Technologies Limited", url: "https://quadrox.com" }],
  creator: "Quadrox Technologies Limited",
  publisher: "LoraBiz",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_NG", 
    url: "/",
    title: "LoraBiz | Business Registration & Identity Services Made Easy",
    description: "Automate your corporate journey with LoraBiz. Seamlessly register your CAC Business Name or LLC, process SCUML certificates, get instant NIN slips, and purchase fast airtime.",
    siteName: "LoraBiz",
    images: [
      {
        url: "/logo.png", 
        width: 1200,
        height: 630,
        alt: "LoraBiz Official Brand Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoraBiz | CAC, NIN, SCUML & Airtime Services",
    description: "Seamlessly register your business, get instant NIN slips, and process SCUML certificates with LoraBiz.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico", 
  },
};

// themeColor is explicitly removed from here because we are handling it dynamically in providers.tsx
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
    // suppressHydrationWarning is necessary here for next-themes
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.className} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-[100dvh] flex flex-col transition-colors duration-300`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
