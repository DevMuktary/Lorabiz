import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instant Tax ID (TIN) Generation Nigeria | Corporate & Individual - Lorabiz',
  description:
    'Generate your official Corporate or Individual Tax Identification Number (TIN) in Nigeria. Direct JTB / NRS integration with fast verification within 30 minutes to 1 hour.',
  keywords: [
    'Tax ID Nigeria',
    'TIN generation online',
    'corporate TIN Nigeria',
    'individual Tax ID JTB',
    'Joint Tax Board TIN',
    'NRS Tax ID lookup',
    'Tax identification number certificate',
    'get TIN online Nigeria',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/services/tax-id',
  },
  openGraph: {
    title: 'Instant Tax ID (TIN) Generation Nigeria | Lorabiz',
    description:
      'Generate official Corporate & Individual Tax Identification Numbers in Nigeria. Verified Joint Tax Board / NRS integration with instant certificate download.',
    url: 'https://lorabiz.com/services/tax-id',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Tax ID Generation Lorabiz',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instant Tax ID (TIN) Generation Nigeria | Lorabiz',
    description:
      'Generate official Corporate and Individual TINs in Nigeria within 1 hour. Direct JTB integration.',
    images: ['https://lorabiz.com/logo.png'],
  },
};

export default function TaxIdLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Tax ID (TIN) Generation Service',
    provider: {
      '@type': 'Organization',
      name: 'LoraBiz',
      legalName: 'QUADROX TECHNOLOGIES LIMITED',
      url: 'https://lorabiz.com',
    },
    serviceType: 'Tax Identification Number Registration',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    description:
      'Fast automated generation and verification of Corporate and Individual Tax Identification Numbers (TIN) in Nigeria via the Joint Tax Board (JTB) and Nigeria Revenue Service (NRS).',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://lorabiz.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: 'https://lorabiz.com/services/tax-id',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Tax ID Generation',
        item: 'https://lorabiz.com/services/tax-id',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
