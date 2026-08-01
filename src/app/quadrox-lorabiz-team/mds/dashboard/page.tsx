"use client";

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, Layers, X, FileText, Activity } from 'lucide-react';

// Expanded dynamic color palette for services
const COLORS = ['#14b8a6', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9']; 

export default function MdsDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/mds/dashboard');
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = data?.kpis || { revenue30d: 0, pendingOrders: 0, avgTat: "0h 0m", activeUsers: 0 };
  const pipeline = data?.pipeline || { pending: 0, queried: 0, completedToday: 0 };
  const revenueData = data?.charts?.revenueData || [];
  const serviceDistribution = data?.charts?.serviceDistribution || [];
  const auditFeed = data?.auditFeed || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans selection:bg-teal-500 selection:text-white animate-in fade-in duration-700">
      
      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard title="Gross Revenue (30d)" value={formatCurrency(kpis.revenue30d)} trend="Live" positive={true} />
            <KpiCard title="Pending Operations" value={kpis.pendingOrders.toString()} trend="Global Queue" positive={false} />
            <KpiCard title="Average Staff TAT" value={kpis.avgTat} trend="Speed" positive={true} icon={<Clock size={16} />} />
            <KpiCard title="Active Client Base" value={kpis.activeUsers.toLocaleString()} trend="Registered" positive={true} />
          </>
        )}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl relative group transition-all">
          {isLoading ? (
            <div className="w-full h-[300px] bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Revenue Trajectory</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/50">Last 7 Days</span>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} tickFormatter={(value) => `₦${value / 1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                      itemStyle={{ color: '#2dd4bf', fontWeight: 700 }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), "Volume"]}
                    />
                    <Line type="monotone" dataKey="total" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#ffffff', strokeWidth: 2, stroke: '#2dd4bf' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#2dd4bf' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Dynamic Service Distribution */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex flex-col">
          {isLoading ? (
            <div className="w-full h-[300px] bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-8">Service Distribution</h2>
              <div className="flex-1 flex flex-col items-center justify-center">
                {serviceDistribution.length > 0 ? (
                  <>
                    <div className="h-[200px] sm:h-[220px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                            {serviceDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-md" />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                            formatter={(value: any) => [`${value}%`, "Market Share"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full mt-6 space-y-3">
                      {serviceDistribution.map((item: any, idx: number) => (
                        <div key={item.name} className="flex items-center justify-between text-sm group bg-slate-50 dark:bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700/30">
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-3 shadow-inner" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-700/30">
                    <Layers className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No operational data exists yet.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Operational Control & Audit Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Generalized Pipeline Status */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl">
          <div className="flex items-center mb-8">
            <div className="p-2 bg-teal-100 dark:bg-teal-500/10 rounded-lg mr-3">
              <Layers className="text-teal-600 dark:text-teal-400" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Global Order Pipeline</h2>
          </div>
          {isLoading ? (
             <div className="w-full h-32 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
          ) : (
            <div className="space-y-6">
              <PipelineRow label="Awaiting Staff Processing" count={pipeline.pending} color="bg-amber-500" percent={pipeline.pending > 0 ? 65 : 0} />
              <PipelineRow label="Queried by Authorities" count={pipeline.queried} color="bg-rose-500" percent={pipeline.queried > 0 ? 15 : 0} />
              <PipelineRow label="Successfully Fulfilled Today" count={pipeline.completedToday} color="bg-teal-500" percent={pipeline.completedToday > 0 ? 100 : 0} />
            </div>
          )}
        </div>

        {/* Live Audit Feed */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3 relative">
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                <Activity className="text-slate-500 dark:text-slate-400" size={20} />
              </div>
              System Audit Feed
            </h2>
          </div>
          {isLoading ? (
             <div className="w-full h-40 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
          ) : (
            <div className="space-y-2">
              {auditFeed.length > 0 ? auditFeed.map((audit: any) => (
                <AuditRow 
                  key={audit.id}
                  staff={audit.staff} 
                  action={audit.action} 
                  target={audit.target} 
                  time={audit.time} 
                  onClick={() => setSelectedAudit(audit)} 
                />
              )) : (
                <p className="text-sm font-medium text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-700/30">No administrative logs recorded recently.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphic Slide-out Drawer */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAudit(null)}></div>
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold tracking-tight flex items-center text-slate-900 dark:text-white">
                <FileText size={22} className="mr-2 text-teal-600 dark:text-teal-400" />
                Audit Telemetry
              </h3>
              <button onClick={() => setSelectedAudit(null)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6 flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Authenticated Actor</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{selectedAudit.staff}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Execution Type</p>
                <p className="text-sm font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/10 inline-block px-3 py-1 rounded border border-teal-200 dark:border-teal-500/20 mt-1">{selectedAudit.action}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Identifier</p>
                <p className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">{selectedAudit.target}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/30">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timestamp</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">{selectedAudit.time}</p>
              </div>
              <div className="pt-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Raw Payload JSON</p>
                <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-teal-300/80 font-mono leading-relaxed border border-slate-200 dark:border-slate-800 break-words shadow-inner">
                  {selectedAudit.details}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function KpiCard({ title, value, trend, positive, icon }: { title: string, value: string, trend: string, positive: boolean, icon?: React.ReactNode }) {
  return (
    <div className="group bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg hover:border-teal-500/30 hover:shadow-md dark:hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default">
      <div className="flex justify-between items-start mb-6">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors tracking-wide">{title}</p>
        {icon && <span className="text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-transparent">{icon}</span>}
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tabular-nums tracking-tighter">{value}</h3>
        <div className={`flex items-center text-xs font-bold uppercase tracking-widest tabular-nums ${positive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {positive ? <ArrowUpRight size={14} className="mr-1.5" /> : <ArrowDownRight size={14} className="mr-1.5" />}
          {trend}
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ label, count, color, percent }: { label: string, count: number, color: string, percent: number }) {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors tracking-wide">{label}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">{count}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden shadow-inner dark:shadow-none">
        <div className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-sm dark:shadow-lg`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function AuditRow({ staff, action, target, time, onClick }: { staff: string, action: string, target: string, time: string, onClick: () => void }) {
  return (
    <div onClick={onClick} className="group flex items-start sm:items-center justify-between p-3.5 -mx-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 transition-all cursor-pointer flex-col sm:flex-row gap-2 sm:gap-0">
      <div className="flex flex-col">
        <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          {staff} <span className="text-slate-500 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors mx-1">initiated</span> <span className="text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/10 px-1.5 py-0.5 rounded ml-1 border border-teal-200 dark:border-transparent">{action}</span>
        </p>
        <p className="text-[11px] font-semibold text-slate-500 mt-1.5 uppercase tracking-wider break-all flex items-center">
          Target Ref: <span className="font-mono ml-2 text-slate-600 dark:text-slate-400 normal-case">{target}</span>
        </p>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 shrink-0 tabular-nums bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">{time}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex flex-col justify-between h-[140px]">
      <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse"></div>
      <div className="w-36 h-10 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse mt-4"></div>
    </div>
  );
}
