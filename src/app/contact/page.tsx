"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight">Get in touch</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">Whether you have a question about registration, pricing, or our APIs, our team is ready to answer all your questions.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 bg-white dark:bg-[#111827] rounded-[40px] border border-black/5 dark:border-white/5 shadow-xl overflow-hidden">
            
            {/* Left Side - Contact Info */}
            <div className="w-full lg:w-2/5 bg-zinc-50 dark:bg-black/20 p-10 lg:p-16 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-semibold mb-8">Contact Information</h3>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Email Us</p>
                    <a href="mailto:hello@lorabiz.com" className="text-lg font-medium text-[#c7365f] hover:text-[#e8447a] transition-colors">hello@lorabiz.com</a>
                  </div>
                  
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Office Address</p>
                    <p className="text-lg font-medium">Ibadan, Oyo State,<br />Nigeria.</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Social Media</p>
                    <a href="https://x.com/use_lorabiz" target="_blank" rel="noreferrer" className="text-lg font-medium hover:text-[#c7365f] transition-colors">@use_lorabiz</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - The Form */}
            <div className="w-full lg:w-3/5 p-10 lg:p-16">
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">First Name</label>
                    <input type="text" placeholder="John" className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Last Name</label>
                    <input type="text" placeholder="Doe" className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <input type="email" placeholder="john@company.com" className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Message</label>
                  <textarea rows={5} placeholder="How can we help you?" className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all resize-none"></textarea>
                </div>

                <button className="w-full py-4 bg-[#c7365f] hover:bg-[#e8447a] text-white font-semibold rounded-lg transition-colors mt-2">
                  Send Message
                </button>

              </form>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
