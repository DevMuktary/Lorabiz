import { Wallet, Files, PencilSimpleLine, HourglassHigh, WarningCircle, Archive } from "@phosphor-icons/react";

interface MetricsProps {
  walletBalance: number;
  stats: any;
  onFilterChange: (type: string, value: string) => void;
  onFundClick: () => void;
}

export default function DashboardMetrics({ walletBalance, stats, onFilterChange, onFundClick }: MetricsProps) {
  const cards = [
    { title: "Total Applications", value: stats?.total || 0, icon: Files, color: "blue", action: () => onFilterChange('status', 'ALL') },
    { title: "Not Submitted", value: stats?.unsubmitted || 0, icon: PencilSimpleLine, color: "gray", action: () => onFilterChange('status', 'UNSUBMITTED') },
    { title: "Pending", value: stats?.pending || 0, icon: HourglassHigh, color: "amber", action: () => onFilterChange('status', 'PENDING') },
    { title: "Queried", value: stats?.queried || 0, icon: WarningCircle, color: "red", action: () => onFilterChange('status', 'QUERIED') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
      
      {/* Wallet is double width for emphasis */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start w-full">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wallet Balance</p>
          <div className="p-2.5 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-xl"><Wallet className="h-6 w-6" weight="fill" /></div>
        </div>
        <div className="mt-6 flex items-center justify-between w-full">
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">₦{walletBalance.toLocaleString()}</h3>
          <button onClick={onFundClick} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-md transition-transform active:scale-95">
            Top Up
          </button>
        </div>
      </div>

      {cards.map((card, idx) => (
        <button 
          key={idx} 
          onClick={card.action} 
          className="bg-white p-6 rounded-3xl border border-slate-200 text-left hover:border-slate-300 hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start w-full">
            <div className={`p-2.5 bg-${card.color}-50 text-${card.color}-500 rounded-xl group-hover:scale-110 transition-transform`}>
              <card.icon className="h-6 w-6" weight="fill" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{card.title}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
