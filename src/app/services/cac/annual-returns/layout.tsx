import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'File CAC Annual Returns Online in Nigeria | Avoid Inactive Status - Lorabiz',
  description:
    'Fast and reliable CAC annual returns filing in Nigeria for Business Names and Limited Liability Companies (LLC). Maintain active status on the CAC public portal, avoid penalty accumulation, and retrieve official filing acknowledgement receipts.',
  keywords: [
    'CAC annual returns filing',
    'file annual returns online Nigeria',
    'CAC annual returns penalty 2026',
    'CAC inactive status remedy',
    'annual returns for business name',
    'annual returns for LLC company',
    'CAMA 2020 annual compliance',
    'CAC acknowledgement letter download',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/services/cac/annual-returns',
  },
  openGraph: {
    title: 'File CAC Annual Returns Online in Nigeria | Lorabiz Compliance Desk',
    description:
      'Fast CAC annual returns filing for registered Nigerian businesses. Keep your business active and clear penalty backlogs in 24 - 48 hours.',
    url: 'https://lorabiz.com/services/cac/annual-returns',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/cac.png',
        width: 800,
        height: 600,
        alt: 'CAC Annual Returns Lorabiz',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'File CAC Annual Returns Online in Nigeria | Lorabiz',
    description:
      'Maintain active status on the CAC public registry. Fast filing for Business Names and Limited Liability Companies.',
    images: ['https://lorabiz.com/cac.png'],
  },
};

export default function AnnualReturnsLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'CAC Annual Returns Statutory Filing Service',
    provider: {
      '@type': 'Organization',
      name: 'LoraBiz',
      legalName: 'QUADROX TECHNOLOGIES LIMITED',
      url: 'https://lorabiz.com',
    },
    serviceType: 'Corporate Affairs Commission Statutory Compliance',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    description:
      'Accredited end-to-end processing and filing of statutory annual returns for Nigerian Business Names and Limited Liability Companies to maintain active legal standing under CAMA 2020.',
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'When are CAC Annual Returns due in Nigeria?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Under CAMA 2020, Business Names must file by June 30th each calendar year (commencing the year after registration). Limited Liability Companies must file within 42 days after their Annual General Meeting (AGM) or at least once every calendar year.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens if a company fails to file CAC Annual Returns?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Defaulting entities accumulate daily/annual penalty fees. More critically, CAC marks the entity as INACTIVE on the public registry, which leads to commercial bank account freezes and blocks tax clearance issuance.',
        },
      },
      {
        '@type': 'Question',
        name: 'What documents are required to file CAC Annual Returns on Lorabiz?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Only ONE document is required: either your official CAC Registration Certificate OR your CAC Status Report / Extract. You do not need to submit both.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I file multiple overdue years at once?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. On Lorabiz, you can select the exact range of unfiled return years (e.g., 2021 to 2025) and our accredited compliance desk processes the complete backlog in a single consolidated submission.',
        },
      },
    ],
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
        name: 'CAC Services',
        item: 'https://lorabiz.com/services/cac',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Annual Returns',
        item: 'https://lorabiz.com/services/cac/annual-returns',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
