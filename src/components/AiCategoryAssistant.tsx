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

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
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
    // Changed: Added universal padding (p-4) and centered it so it always floats
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"} transition-opacity duration-200`}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* 
        Changed: Removed h-[100dvh]. 
        Added max-h-[75vh] so it never stretches to the top/bottom edges of the screen.
        Ensured rounded-3xl applies to mobile as well.
      */}
      <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col h-[550px] max-h-[75vh] transition-transform duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#ff3f7a] to-orange-400 flex items-center justify-center text-white shadow-sm">
              <Sparkle className="h-4 w-4" weight="fill" />
            </div>
            <h3 className="font-bold text-slate-900">LumeBizAi</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 overscroll-contain"
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

        <div className="p-4 bg-white border-t border-slate-100 rounded-b-3xl shrink-0">
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
          <div className="text-center mt-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by AI</span>
          </div>
        </div>

      </div>
    </div>
  );
}
