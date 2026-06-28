import { Wallet, Files, PencilSimpleLine, HourglassHigh, WarningCircle } from "@phosphor-icons/react";

interface MetricsProps {
  walletBalance: number;
  stats: any;
  currentStatus: string;
  onFilterChange: (type: string, value: string) => void;
  onFundClick: () => void;
}

export default function DashboardMetrics({ walletBalance, stats, currentStatus, onFilterChange, onFundClick }: MetricsProps) {
  const cards = [
    { title: "All Applications", value: stats?.total || 0, icon: Files, color: "blue", statusValue: "ALL" },
    { title: "Not Submitted", value: stats?.unsubmitted || 0, icon: PencilSimpleLine, color: "slate", statusValue: "UNSUBMITTED" },
    { title: "Pending", value: stats?.pending || 0, icon: HourglassHigh, color: "amber", statusValue: "PENDING" },
    { title: "Queried", value: stats?.queried || 0, icon: WarningCircle, color: "red", statusValue: "QUERIED" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
      
      {/* Wallet Card - Centered & Aligned */}
      <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-xl shadow-inner">
            <Wallet className="h-6 w-6" weight="fill" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            ₦{walletBalance.toLocaleString()}
          </h3>
          <button onClick={onFundClick} className="px-6 py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] transition-transform active:scale-95 whitespace-nowrap">
            Top Up Wallet
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {cards.map((card, idx) => {
        const isActive = currentStatus === card.statusValue;
        return (
          <button 
            key={idx} 
            onClick={() => onFilterChange('status', card.statusValue)} 
            className={`bg-white p-6 rounded-3xl border text-left transition-all active:scale-95 group flex flex-col justify-between
              ${isActive ? 'border-[#ff3f7a] shadow-md ring-1 ring-[#ff3f7a]/20' : 'border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}
            `}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`p-2.5 rounded-xl transition-transform ${isActive ? 'bg-[#ff3f7a]/10 text-[#ff3f7a]' : `bg-${card.color}-50 text-${card.color}-500 group-hover:scale-110`}`}>
                <card.icon className="h-6 w-6" weight="fill" />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-[#ff3f7a]' : 'text-slate-400'}`}>
                {card.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
