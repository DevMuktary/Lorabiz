"use client";

import { useState, useEffect } from "react";
import { 
  Receipt, MagnifyingGlass, Funnel, ArrowDownLeft, ArrowUpRight, 
  Copy, Check, Eye, X, Spinner, Archive 
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals & UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewTransaction, setViewTransaction] = useState<any | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/user/transactions");
        const data = await res.json();
        if (data.success) setTransactions(data.transactions);
      } catch (err) {
        console.error("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.reference.toLowerCase().includes(search.toLowerCase()) || 
      tx.description.toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    const txDate = new Date(tx.createdAt).getTime();

    if (startDate) {
      matchesDate = matchesDate && txDate >= new Date(startDate).getTime();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && txDate <= end.getTime();
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <Receipt weight="duotone" className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Transaction History</h1>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">View and track all your financial activities.</p>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID or description..." 
            className="pl-11 h-12 bg-secondary/50 border-border rounded-xl font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Funnel className="h-5 w-5 text-muted-foreground hidden sm:block" weight="bold" />
          <Input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-12 bg-secondary/50 border-border rounded-xl font-medium w-full sm:w-auto"
          />
          <span className="text-muted-foreground font-bold">-</span>
          <Input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-12 bg-secondary/50 border-border rounded-xl font-medium w-full sm:w-auto"
          />
        </div>
      </div>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center">
            <Spinner className="animate-spin h-8 w-8 text-primary mx-auto" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" weight="duotone" />
            <p className="font-bold text-base">No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            {/* 📱 MOBILE VIEW (Card Layout) */}
            <div className="block md:hidden divide-y divide-border/50">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {tx.type === "CREDIT" ? <ArrowDownLeft weight="bold" className="h-5 w-5" /> : <ArrowUpRight weight="bold" className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm line-clamp-2 leading-snug mb-1">{tx.description}</p>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className={`font-black text-sm shrink-0 ${tx.type === "CREDIT" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {tx.type === "CREDIT" ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pl-13">
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono truncate max-w-[100px] sm:max-w-[150px]">
                        {tx.reference.substring(0, 15)}...
                      </span>
                      <button onClick={(e) => handleCopy(e, tx.reference)} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        {copiedId === tx.reference ? <Check weight="bold" className="text-emerald-500 h-3.5 w-3.5" /> : <Copy weight="bold" className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        tx.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600" : 
                        tx.status === "PENDING" ? "bg-amber-500/10 text-amber-600" : 
                        "bg-red-500/10 text-red-600"
                      }`}>
                        {tx.status}
                      </span>
                      <button 
                        onClick={() => setViewTransaction(tx)}
                        className="p-1.5 bg-secondary text-muted-foreground rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye weight="bold" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 💻 DESKTOP VIEW (Table Layout) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Transaction Details</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {tx.type === "CREDIT" ? <ArrowDownLeft weight="bold" className="h-5 w-5" /> : <ArrowUpRight weight="bold" className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-foreground truncate max-w-xs">{tx.description}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-medium text-muted-foreground font-mono">{tx.reference}</span>
                              <button 
                                onClick={(e) => handleCopy(e, tx.reference)}
                                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              >
                                {copiedId === tx.reference ? <Check weight="bold" className="text-emerald-500" /> : <Copy weight="bold" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-black ${tx.type === "CREDIT" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                          {tx.type === "CREDIT" ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs font-medium text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          tx.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600" : 
                          tx.status === "PENDING" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setViewTransaction(tx)}
                          className="p-2 bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Eye weight="bold" className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* VIEW MODAL (Unchanged, already responsive) */}
      {viewTransaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50">
              <h3 className="font-black text-lg text-foreground">Transaction Receipt</h3>
              <button onClick={() => setViewTransaction(null)} className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground transition-colors cursor-pointer">
                <X weight="bold" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Amount</p>
                <h2 className={`text-4xl font-black ${viewTransaction.type === "CREDIT" ? "text-emerald-500" : "text-foreground"}`}>
                  {viewTransaction.type === "CREDIT" ? "+" : "-"}₦{Number(viewTransaction.amount).toLocaleString()}
                </h2>
                <span className={`inline-flex mt-3 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                  viewTransaction.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                }`}>
                  {viewTransaction.status}
                </span>
              </div>

              <div className="space-y-4 bg-secondary/30 p-4 rounded-2xl border border-border text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Type</span>
                  <span className="font-bold text-foreground">{viewTransaction.type}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3 gap-4">
                  <span className="font-medium text-muted-foreground shrink-0">Description</span>
                  <span className="font-bold text-foreground text-right line-clamp-2">{viewTransaction.description}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3">
                  <span className="font-medium text-muted-foreground">Date</span>
                  <span className="font-bold text-foreground">{new Date(viewTransaction.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3 gap-2">
                  <span className="font-medium text-muted-foreground">Reference</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-foreground font-mono truncate">{viewTransaction.reference}</span>
                    <button onClick={(e) => handleCopy(e, viewTransaction.reference)} className="text-primary cursor-pointer shrink-0">
                      {copiedId === viewTransaction.reference ? <Check weight="bold" /> : <Copy weight="bold" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
