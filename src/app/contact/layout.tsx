import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Customer Support & Headquarters - Lorabiz',
  description:
    'Need assistance with your CAC registration, SCUML certificate, or Tax ID? Reach out to the LoraBiz customer support desk in Lagos, Nigeria.',
  keywords: [
    'contact Lorabiz',
    'Lorabiz customer service',
    'CAC support Nigeria',
    'Lorabiz office Lagos',
    'compliance desk support',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/contact',
  },
  openGraph: {
    title: 'Contact Us | Lorabiz Support',
    description: 'Get in touch with the LoraBiz team for corporate compliance and registration support.',
    url: 'https://lorabiz.com/contact',
    siteName: 'Lorabiz',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
