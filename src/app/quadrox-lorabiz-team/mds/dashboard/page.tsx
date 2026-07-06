"use client";

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, Layers, X, FileText, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b'];

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

  // Safe defaults if data fails to load
  const kpis = data?.kpis || { revenue30d: 0, pendingRegistrations: 0, avgTat: "0h 0m", activeUsers: 0 };
  const pipeline = data?.pipeline || { pending: 0, queried: 0, approvedToday: 0 };
  const revenueData = data?.charts?.revenueData || [];
  const serviceDistribution = data?.charts?.serviceDistribution || [];
  const auditFeed = data?.auditFeed || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard title="Gross Revenue (30d)" value={formatCurrency(kpis.revenue30d)} trend="Live" positive={true} />
            <KpiCard title="Pending Registrations" value={kpis.pendingRegistrations.toString()} trend="Active" positive={true} />
            <KpiCard title="Average Staff TAT" value={kpis.avgTat} trend="Speed" positive={true} icon={<Clock size={16} />} />
            <KpiCard title="Active Users" value={kpis.activeUsers.toLocaleString()} trend="Total" positive={true} />
          </>
        )}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ring-1 ring-white/5 relative group transition-all">
          {isLoading ? (
            <div className="w-full h-[300px] bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg"></div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Revenue Trend (7 Days)</h2>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(value) => `₦${value / 1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#818cf8', fontWeight: 500 }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), "Revenue"]}
                    />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, stroke: '#fff' }} className="drop-shadow-sm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Service Distribution */}
        <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ring-1 ring-white/5 flex flex-col">
          {isLoading ? (
            <div className="w-full h-[300px] bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg"></div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Service Distribution</h2>
              <div className="flex-1 flex flex-col items-center justify-center">
                {serviceDistribution.length > 0 ? (
                  <>
                    <div className="h-[200px] sm:h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {serviceDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full mt-4 space-y-2">
                      {serviceDistribution.map((item: any, idx: number) => (
                        <div key={item.name} className="flex items-center justify-between text-sm group">
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx] }}></span>
                            <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{item.name}</span>
                          </div>
                          <span className="font-medium tabular-nums">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">No data available yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Operational Control & Audit Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Filing Pipeline Status */}
        <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ring-1 ring-white/5 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-6">
            <Layers className="text-indigo-500 mr-2" size={20} />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Pipeline Status</h2>
          </div>
          {isLoading ? (
             <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg"></div>
          ) : (
            <div className="space-y-6">
              <PipelineRow label="Pending Review" count={pipeline.pending} color="bg-amber-500" percent={pipeline.pending > 0 ? 65 : 0} />
              <PipelineRow label="Queried by CAC" count={pipeline.queried} color="bg-red-500" percent={pipeline.queried > 0 ? 15 : 0} />
              <PipelineRow label="Approved Today" count={pipeline.approvedToday} color="bg-emerald-500" percent={pipeline.approvedToday > 0 ? 100 : 0} />
            </div>
          )}
        </div>

        {/* Live Audit Feed */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <Activity className="mr-2 text-zinc-400" size={18} /> Live Audit Feed
            </h2>
          </div>
          {isLoading ? (
             <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg"></div>
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
                <p className="text-sm text-zinc-500 text-center py-4">No audit logs found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphic Slide-out Drawer */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAudit(null)}></div>
          <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 animate-in slide-in-from-right duration-300 ease-out flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
              <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
                <FileText size={20} className="mr-2 text-indigo-500" />
                Audit Entry Details
              </h3>
              <button onClick={() => setSelectedAudit(null)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Actor</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedAudit.staff}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Action Performed</p>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 inline-block px-2 py-1 rounded">{selectedAudit.action}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Target Asset</p>
                <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{selectedAudit.target}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Timestamp</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 tabular-nums">{selectedAudit.time}</p>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">System Log Details</p>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed border border-zinc-200 dark:border-zinc-800/80 break-words">
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
    <div className="group bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ring-1 ring-white/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-default">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">{title}</p>
        {icon && <span className="text-zinc-400 group-hover:text-indigo-400 transition-colors">{icon}</span>}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tabular-nums tracking-tight">{value}</h3>
        <div className={`flex items-center text-xs font-medium tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {positive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ label, count, color, percent }: { label: string, count: number, color: string, percent: number }) {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">{label}</span>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{count}</span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function AuditRow({ staff, action, target, time, onClick }: { staff: string, action: string, target: string, time: string, onClick: () => void }) {
  return (
    <div onClick={onClick} className="group flex items-start sm:items-center justify-between p-3 -mx-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer flex-col sm:flex-row gap-2 sm:gap-0">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {staff} <span className="text-zinc-400 font-normal group-hover:text-zinc-500 transition-colors">performed</span> <span className="text-indigo-600 dark:text-indigo-400">{action}</span>
        </p>
        <p className="text-xs text-zinc-500 mt-1 break-all flex items-center">
          Target: <span className="font-mono ml-1">{target}</span>
        </p>
      </div>
      <span className="text-xs text-zinc-400 shrink-0 tabular-nums font-medium group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{time}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900/80 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="w-24 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
      <div className="w-32 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mt-4"></div>
    </div>
  );
}
