import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | CAC, SCUML & Tax ID - Lorabiz',
  description:
    'Find answers to common questions about CAC business registration timelines, SCUML certificate requirements, instant Tax ID generation, and wallet funding on Lorabiz.',
  keywords: [
    'Lorabiz FAQ',
    'CAC registration questions',
    'how long does CAC registration take',
    'SCUML requirements Nigeria',
    'how fast is TIN generated',
    'NIN slip types CAC',
    'Lorabiz customer help',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | Lorabiz',
    description:
      'Answers to key questions regarding Nigerian corporate registrations, SCUML certificates, Tax IDs, and identity verification.',
    url: 'https://lorabiz.com/faq',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Lorabiz FAQ',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does CAC Registration take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Business Names take about 1-2 working hours, Limited Liability Companies (LLCs) take 3-7 business days, and NGOs/Incorporated Trustees take 1-2 months due to newspaper publication requirements.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is SCUML and do I need it?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SCUML stands for Special Control Unit against Money Laundering, managed by the EFCC. You need it if you operate a Designated Non-Financial Business or Profession (e.g., NGOs, Real Estate, Law Firms, Jewelers) before you can open a corporate bank account.',
        },
      },
      {
        '@type': 'Question',
        name: 'How fast can I get my Tax ID (TIN)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Once requested through our platform, we connect directly with the Nigeria Revenue Service (NRS) API to generate your official Corporate or Individual TIN within 30 minutes to 1 working hour.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the different types of NIN Slips?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer three types: Regular (contains full demographic details, required by CAC), Standard (for basic banking/telecom KYC), and Premium (fully colored card format for advanced verification).',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I fund my wallet to buy Data or Airtime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can fund your LoraBiz wallet instantly via bank transfer or card payment through our secure payment gateway. Once funded, you can purchase cheap SME data, airtime, and pay electricity bills automatically.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there any hidden fees?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No! LoraBiz prides itself on transparent pricing. The fees displayed on your dashboard during checkout are the final prices you pay. By cutting out middle-man agents, we save you up to 60% on traditional registration fees.',
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
        name: 'Help Center',
        item: 'https://lorabiz.com/faq',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
