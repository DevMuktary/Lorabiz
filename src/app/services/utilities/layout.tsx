import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discounted VTU Airtime & Cheap SME Data Bundles Nigeria - Lorabiz',
  description:
    'Instant automated VTU airtime recharge and affordable SME data bundles across MTN, Airtel, Glo, and 9mobile in Nigeria. Corporate gifting and personal subscriptions.',
  keywords: [
    'VTU airtime Nigeria',
    'cheap SME data bundles',
    'buy airtime online Nigeria',
    'MTN SME data',
    'Airtel corporate gifting data',
    'Glo data bundles',
    '9mobile VTU',
    'automated utility payments',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/services/utilities',
  },
  openGraph: {
    title: 'Discounted VTU Airtime & SME Data Bundles | Lorabiz',
    description:
      'Fast, automated virtual top-up (VTU) and discounted SME data bundles for all Nigerian telecom networks.',
    url: 'https://lorabiz.com/services/utilities',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Utilities Lorabiz',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discounted VTU Airtime & SME Data Bundles | Lorabiz',
    description:
      'Instant airtime top-up and affordable SME data bundles across MTN, Airtel, Glo, and 9mobile.',
    images: ['https://lorabiz.com/logo.png'],
  },
};

export default function UtilitiesLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Telecom & Utility Top-up Services',
    provider: {
      '@type': 'Organization',
      name: 'LoraBiz',
      legalName: 'QUADROX TECHNOLOGIES LIMITED',
      url: 'https://lorabiz.com',
    },
    serviceType: 'Telecommunications & Utilities Payment Processing',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    description:
      'Automated Virtual Top-Up (VTU) and high-speed SME/Direct internet data bundle subscriptions across MTN, Airtel, Globacom, and 9mobile in Nigeria.',
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
        item: 'https://lorabiz.com/services/utilities',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Utilities & VTU',
        item: 'https://lorabiz.com/services/utilities',
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
