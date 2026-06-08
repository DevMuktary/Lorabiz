"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkle, PaperPlaneRight, Robot, User } from "@phosphor-icons/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const parseMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export function AiCategoryAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! Tell me what your business does, and I'll tell you exactly which category to select." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom whenever messages change
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      requestAnimationFrame(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth"
        });
      });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/category-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Oops, my network dropped. Can you repeat that?" }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops, my network dropped. Can you repeat that?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    // Backdrop wrapper - completely separate from the modal's positioning
    <div className={`fixed inset-0 z-[100] ${isOpen ? "visible" : "invisible pointer-events-none"}`}>
      
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} 
        onClick={onClose}
      />
      
      {/* THE FIX: 
        1. 'fixed bottom-0' on mobile.
        2. Hardcoded 'h-[450px]'. It will NEVER shrink or squish when the keyboard opens.
        3. On desktop (sm), it perfectly centers itself as a 400x550 modal.
      */}
      <div className={`
        fixed bottom-0 left-0 w-full h-[480px]
        sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] sm:h-[550px] sm:bottom-auto
        bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col 
        transition-transform duration-300 ease-out
        ${isOpen ? "translate-y-0 sm:scale-100" : "translate-y-full sm:translate-y-[150%] sm:scale-95"}
      `}>
        
        {/* HEADER: min-h-[72px] guarantees Safari cannot squish it */}
        <div className="min-h-[72px] shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#ff3f7a] to-orange-400 flex items-center justify-center text-white shadow-sm">
              <Sparkle className="h-4 w-4" weight="fill" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">LumeBizAi</h3>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        {/* CHAT AREA: flex-1 ensures it takes the remaining space of the 450px box */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 overscroll-contain bg-white"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-slate-100 text-slate-500" : "bg-[#ff3f7a]/10 text-[#ff3f7a]"}`}>
                {msg.role === "user" ? <User weight="fill" /> : <Robot weight="fill" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${
                msg.role === "user" 
                  ? "bg-slate-900 text-white rounded-tr-sm shadow-sm" 
                  : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm whitespace-pre-wrap leading-relaxed shadow-sm"
              }`}>
                {parseMarkdown(msg.content)}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center">
                <Robot weight="fill" />
              </div>
              <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-100 flex items-center gap-1.5 w-fit shadow-sm">
                <span className="h-1.5 w-1.5 bg-[#ff3f7a] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 bg-[#ff3f7a] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 bg-[#ff3f7a] rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA: min-h-[85px] guarantees it never gets squished */}
        <div className="min-h-[85px] shrink-0 p-4 bg-white border-t border-slate-100 sm:rounded-b-3xl">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. I sell shoes online..."
              className="w-full h-12 pl-4 pr-12 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl outline-none focus:border-[#ff3f7a] focus:bg-white transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 h-8 w-8 bg-[#ff3f7a] text-white rounded-lg flex items-center justify-center hover:bg-[#e02b62] transition-colors disabled:opacity-50 shadow-sm"
            >
              <PaperPlaneRight className="h-4 w-4" weight="fill" />
            </button>
          </form>
          <div className="text-center mt-2.5">
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">POWERED BY LUMEBIZ</span>
          </div>
        </div>

      </div>
    </div>
  );
}
