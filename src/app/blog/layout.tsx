import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lorabiz Blog | Nigerian Business, CAC & Corporate Compliance Insights',
  description:
    'Expert guides, statutory compliance updates, and actionable business advice for Nigerian entrepreneurs, startups, and registered entities. Learn about CAC filings, SCUML, Tax IDs, and company registration.',
  keywords: [
    'Lorabiz blog',
    'Nigerian business advice',
    'CAC registration guide',
    'CAC annual returns guide',
    'how to start a business in Nigeria',
    'SCUML certificate requirements',
    'corporate affairs commission Nigeria',
    'SME guide Nigeria',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/blog',
  },
  openGraph: {
    title: 'Lorabiz Blog | Nigerian Business & Corporate Compliance Insights',
    description:
      'Actionable business guides, CAC regulatory updates, and corporate compliance strategies for Nigerian enterprises.',
    url: 'https://lorabiz.com/blog',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Lorabiz Blog',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
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
        name: 'Blog',
        item: 'https://lorabiz.com/blog',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
