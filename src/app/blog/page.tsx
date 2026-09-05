"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getAllPosts } from "@/lib/blog-data";

export default function BlogIndexPage() {
  const allPosts = getAllPosts();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Corporate Compliance", "Business Registration", "Tax & Finance"];

  const filteredPosts =
    selectedCategory === "All"
      ? allPosts
      : allPosts.filter((p) => p.category === selectedCategory);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300 w-full max-w-[100vw] overflow-x-clip">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 w-full max-w-full overflow-x-clip">
        {/* Glow ambient background safely contained */}
        <div className="absolute top-0 left-0 right-0 h-[350px] overflow-hidden pointer-events-none">
          <div className="w-[400px] sm:w-[600px] h-[300px] mx-auto bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* HEADER */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-4">
              Knowledge Hub & Guides
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
              The LoraBiz Compliance & Growth Blog
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Practical guides, statutory regulatory updates, and actionable insights to keep your Nigerian business compliant and thriving.
            </p>
          </div>

          {/* CATEGORY FILTER TABS */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/60 dark:border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* POSTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                      {post.category}
                    </span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                      LB
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{post.author.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{post.publishedAt}</p>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                  >
                    Read Guide &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* NEWSLETTER / SUBSCRIBE CTA */}
          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center max-w-xl mx-auto">
            <h3 className="text-base font-bold mb-1">Stay updated on Nigerian regulatory changes</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Get the latest CAC, tax, and corporate compliance updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your business email"
                className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-base sm:text-sm outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
