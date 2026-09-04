export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  keywords: string[];
  contentHtml: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-file-cac-annual-returns-nigeria',
    title: 'How to File CAC Annual Returns in Nigeria (2026 Step-by-Step Guide & Penalties)',
    excerpt:
      'A complete guide to statutory CAC annual returns filing for Business Names and LLCs in Nigeria. Learn about deadlines, default penalty calculations, and how to maintain active status on the CAC public portal.',
    category: 'Corporate Compliance',
    publishedAt: '2026-09-04',
    readTime: '6 min read',
    author: {
      name: 'LoraBiz Compliance Desk',
      role: 'Corporate Affairs Specialists',
    },
    keywords: [
      'how to file cac annual returns',
      'cac annual returns deadline nigeria',
      'cac annual returns penalty fee',
      'cac inactive status remedy',
      'cama 2020 annual returns',
      'business name annual returns nigeria',
      'llc company annual returns',
    ],
    contentHtml: `
      <p class="lead text-lg text-zinc-600 dark:text-zinc-300 mb-6 font-medium leading-relaxed">
        Registering a business with the Corporate Affairs Commission (CAC) is only the first step toward corporate legitimacy in Nigeria. Under the Companies and Allied Matters Act (CAMA 2020), every registered business entity—whether a small retail Business Name, a Tech Startup LLC, or an NGO—is legally required to file <strong>Statutory Annual Returns</strong> every single year.
      </p>

      <div class="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl my-6 text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
        <strong>Important Notice:</strong> In recent regulatory circulars, the CAC has begun aggressively tagging non-compliant companies as <strong>INACTIVE</strong> on the public registration portal. Commercial banks in Nigeria are mandated to restrict transactions on corporate accounts linked to inactive entities until all overdue annual returns are fully cleared.
      </div>

      <h2 class="text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white">What Are CAC Annual Returns?</h2>
      <p class="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        An Annual Return is not a financial tax payment. Many business owners confuse Annual Returns with Company Income Tax (CIT) paid to the tax authority. Instead, an Annual Return is a statutory confirmation submitted directly to the Corporate Affairs Commission verifying that your business is active, operational, and keeping its registered addresses, ownership details, and director profiles current.
      </p>

      <h2 class="text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white">When Are Annual Returns Due in Nigeria?</h2>
      <p class="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        Filing timelines depend strictly on your entity classification:
      </p>
      <ul class="list-disc pl-6 space-y-2 mb-6 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <li><strong>Business Names (Sole Proprietorships / Partnerships):</strong> Due not later than <strong>June 30th</strong> of each calendar year, starting the calendar year immediately following the year of registration.</li>
        <li><strong>Limited Liability Companies (LLC / LTD):</strong> Must be filed within <strong>42 days</strong> after holding your Annual General Meeting (AGM), or at least once every calendar year. Newly incorporated companies are granted an 18-month grace window from the date of incorporation before their first return is mandatory.</li>
        <li><strong>Incorporated Trustees (NGOs / Foundations / Associations):</strong> Must file between June 30th and December 31st each calendar year, accompanied by an audited statement of affairs.</li>
      </ul>

      <h2 class="text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white">Consequences of Failing to File</h2>
      <p class="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        Ignoring statutory returns leads to severe operational roadblocks for Nigerian business owners:
      </p>
      <ol class="list-decimal pl-6 space-y-2 mb-6 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <li><strong>Inactive Status on the CAC Public Search:</strong> When investors, clients, or banks search your company name on the public CAC database, it will display a red "INACTIVE" status, signaling non-compliance.</li>
        <li><strong>Corporate Bank Account Freezes:</strong> Nigerian banks conduct periodic KYC compliance audits. An inactive status blocks account operations, loans, and international transfers.</li>
        <li><strong>Inability to Obtain SCUML or Tax Clearance:</strong> The EFCC Special Control Unit Against Money Laundering (SCUML) and tax authorities require proof of active annual filing before granting compliance certificates.</li>
        <li><strong>Daily Accumulation of Statutory Penalties:</strong> Late filings attract default penalty charges for each overdue year. Over 3 to 5 years, accumulated penalties can surpass the original cost of incorporation.</li>
        <li><strong>Risk of Strike-Off / Delisting:</strong> The CAC possesses statutory powers under Section 692 of CAMA 2020 to delist and dissolve companies that remain dormant and fail to file returns for over 10 consecutive years.</li>
      </ol>

      <div class="my-8 p-6 rounded-2xl bg-zinc-900 text-white border border-emerald-500/30 text-center">
        <h3 class="text-xl font-bold mb-2">Need to File Your Annual Returns Fast?</h3>
        <p class="text-sm text-zinc-300 mb-4 max-w-lg mx-auto">
          Clear your backlog and maintain an active status on the CAC registry in 24 - 48 hours without visiting a physical office.
        </p>
        <a href="/dashboard/cac/post-incorporation/annual-returns" class="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-md">
          File Annual Returns on Lorabiz &rarr;
        </a>
      </div>

      <h2 class="text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white">Documents Required to File</h2>
      <p class="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        Filing on LoraBiz has been simplified to minimize bureaucratic paperwork. You only need to provide:
      </p>
      <ul class="list-disc pl-6 space-y-2 mb-6 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <li><strong>Business Registration Number (BN or RC Number)</strong></li>
        <li><strong>One (1) Verification Document:</strong> Either your official <em>CAC Registration Certificate</em> OR your <em>CAC Status Report / Extract</em>. Only one document is required.</li>
        <li><strong>Filing Year(s):</strong> Specify whether you are filing for the current year or clearing a multi-year backlog.</li>
        <li><strong>Digital Signature:</strong> A simple digital sign-off confirming authorization.</li>
      </ul>

      <h2 class="text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white">Step-by-Step: Filing Through Lorabiz</h2>
      <p class="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        1. <strong>Access Your Dashboard:</strong> Log in to your LoraBiz account and navigate to the <em>CAC Post-Incorporation</em> desk under <em>Annual Returns</em>.<br/>
        2. <strong>Select Your Entity Type:</strong> Choose between Business Name or Limited Liability Company (LLC).<br/>
        3. <strong>Input Return Range:</strong> Select the return years you wish to file for.<br/>
        4. <strong>Upload Document:</strong> Attach your certificate or status extract and complete the instant verification.<br/>
        5. <strong>Download Official Receipt:</strong> Once processed by our accredited compliance officers (usually within 24–48 hours), your official CAC Acknowledgement letter with verifiable QR code is available directly in your dashboard history.
      </p>

      <h2 class="text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white">Conclusion</h2>
      <p class="mb-6 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        Statutory compliance is not an optional luxury—it is the foundation of every thriving enterprise in Nigeria. Ensuring your CAC annual returns are up to date protects your corporate reputation, unlocks banking facilities, and prevents costly regulatory penalties.
      </p>
    `,
  },
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
