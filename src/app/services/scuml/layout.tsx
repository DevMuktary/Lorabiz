import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SCUML Certificate Registration Nigeria | Fast EFCC Clearance Online - Lorabiz',
  description:
    'Fast-track your SCUML registration with the EFCC in Nigeria. Mandatory anti-money laundering compliance certificate for real estate, NGOs, law firms, consultants, and opening corporate bank accounts.',
  keywords: [
    'SCUML registration Nigeria',
    'SCUML certificate online',
    'EFCC SCUML compliance',
    'SCUML requirements real estate',
    'DNFI certificate Nigeria',
    'open corporate bank account SCUML',
    'special control unit against money laundering',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/services/scuml',
  },
  openGraph: {
    title: 'SCUML Certificate Registration Nigeria | Fast EFCC Clearance - Lorabiz',
    description:
      'Obtain your official EFCC Special Control Unit Against Money Laundering (SCUML) certificate without delays. Professional review and end-to-end processing.',
    url: 'https://lorabiz.com/services/scuml',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'SCUML Registration Lorabiz',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SCUML Certificate Registration Nigeria | Lorabiz',
    description:
      'Fast-track your SCUML certificate with the EFCC in Nigeria. 100% compliant documentation for corporate bank accounts.',
    images: ['https://lorabiz.com/logo.png'],
  },
};

export default function ScumlLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'SCUML Certificate Registration Service',
    provider: {
      '@type': 'Organization',
      name: 'LoraBiz',
      legalName: 'QUADROX TECHNOLOGIES LIMITED',
      url: 'https://lorabiz.com',
    },
    serviceType: 'Special Control Unit Against Money Laundering Registration',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    description:
      'Assisted EFCC SCUML compliance and certification for Designated Non-Financial Businesses and Professions (DNFBP) in Nigeria.',
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
        item: 'https://lorabiz.com/services/scuml',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'SCUML Registration',
        item: 'https://lorabiz.com/services/scuml',
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
