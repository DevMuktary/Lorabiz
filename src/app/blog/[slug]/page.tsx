import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getPostBySlug, getAllPosts } from "@/lib/blog-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | Lorabiz Blog",
    };
  }

  return {
    title: `${post.title} | Lorabiz Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: {
      canonical: `https://lorabiz.com/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | Lorabiz`,
      description: post.excerpt,
      url: `https://lorabiz.com/blog/${post.slug}`,
      siteName: "Lorabiz",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: "https://lorabiz.com/cac.png",
          width: 800,
          height: 600,
          alt: post.title,
        },
      ],
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["https://lorabiz.com/cac.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: `https://lorabiz.com/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "LoraBiz Compliance Desk",
      url: "https://lorabiz.com",
    },
    publisher: {
      "@type": "Organization",
      name: "LoraBiz",
      legalName: "QUADROX TECHNOLOGIES LIMITED",
      logo: {
        "@type": "ImageObject",
        url: "https://lorabiz.com/logo.png",
      },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://lorabiz.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://lorabiz.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://lorabiz.com/blog/${post.slug}`,
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="pt-32 pb-24 px-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-zinc-900 dark:text-white font-medium truncate max-w-[200px] sm:max-w-xs">
              {post.category}
            </span>
          </div>

          {/* ARTICLE HEADER */}
          <header className="mb-10 pb-8 border-b border-zinc-200 dark:border-zinc-800">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-4">
              {post.category}
            </span>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center">
                  LB
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{post.author.name}</p>
                  <p className="text-[11px] text-zinc-500">{post.author.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span>Published on {post.publishedAt}</span>
                <span>•</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* ARTICLE BODY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content */}
            <article className="lg:col-span-8">
              <div
                className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />

              {/* ARTICLE FOOTER / SHARE */}
              <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4">
                <Link
                  href="/blog"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  &larr; Back to all guides
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Share this guide:</span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://lorabiz.com/blog/${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    X (Twitter)
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - https://lorabiz.com/blog/${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>

            {/* Sticky Sidebar CTA */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="sticky top-28 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-3 inline-block">
                  Statutory Desk
                </span>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-2">
                  Need to file your CAC Annual Returns?
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
                  Avoid penalty fees and clear your unfiled return backlogs directly from your dashboard in 24 - 48 hours.
                </p>
                <Link
                  href="/dashboard/cac/post-incorporation/annual-returns"
                  className="w-full block py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl text-center transition-colors shadow-md"
                >
                  File Annual Returns Now
                </Link>
                <Link
                  href="/services/cac/annual-returns"
                  className="w-full block py-2.5 px-4 mt-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium text-xs text-center transition-colors"
                >
                  Learn more about filing &rarr;
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
