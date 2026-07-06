"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, Activity } from 'lucide-react';

// Mock Data for Visualization
const revenueData = [
  { name: 'Mon', total: 420000 },
  { name: 'Tue', total: 380000 },
  { name: 'Wed', total: 510000 },
  { name: 'Thu', total: 470000 },
  { name: 'Fri', total: 620000 },
  { name: 'Sat', total: 850000 },
  { name: 'Sun', total: 910000 },
];

const serviceDistribution = [
  { name: 'Business Names', value: 45 },
  { name: 'LLC Formations', value: 35 },
  { name: 'NIN Slips', value: 20 },
];
const COLORS = ['#6366f1', '#14b8a6', '#f59e0b']; // Indigo, Teal, Amber

export default function MdsDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Gross Revenue (30d)" value="₦12,450,000" trend="+14.5%" positive={true} />
        <KpiCard title="Pending Registrations" value="142" trend="-5.2%" positive={true} />
        <KpiCard title="Average Staff TAT" value="4h 12m" trend="+1h 5m" positive={false} icon={<Clock size={16} />} />
        <KpiCard title="Active Users" value="8,902" trend="+12.1%" positive={true} />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Revenue Trend</h2>
            <select className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm rounded-md px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(value) => `₦${value / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: any) => {
                    const numValue = Number(value);
                    if (isNaN(numValue)) return '₦0.00';
                    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(numValue);
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Service Distribution</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="w-full mt-4 space-y-2">
              {serviceDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx] }}></span>
                    <span className="text-zinc-600 dark:text-zinc-400">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Control & Audit Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Controls */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center mb-6">
            <Activity className="text-indigo-500 mr-2" size={20} />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">System Controls</h2>
          </div>
          <div className="space-y-4">
            <ControlToggle label="CAC API Sync" status="Operational" active={true} />
            <ControlToggle label="NIN Verification" status="Operational" active={true} />
            <ControlToggle label="Wallet Funding" status="Maintenance" active={false} />
            <ControlToggle label="New Registrations" status="Operational" active={true} />
          </div>
        </div>

        {/* Live Audit Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Live Audit Feed</h2>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View Full Ledger</button>
          </div>
          <div className="space-y-4">
            <AuditRow staff="Nadim A." action="APPROVED_LLC" target="#839201" time="2 mins ago" />
            <AuditRow staff="Ahmed A." action="QUERIED_CAC_APPLICATION" target="#482910" time="15 mins ago" />
            <AuditRow staff="System" action="AUTO_REFUND_PROCESSED" target="Wallet_usr_8f9a" time="1 hour ago" />
            <AuditRow staff="MD" action="UPDATED_PRICING" target="LLC Registration" time="3 hours ago" />
          </div>
        </div>
      </div>

    </div>
  );
}

// Sub-components

function KpiCard({ title, value, trend, positive, icon }: { title: string, value: string, trend: string, positive: boolean, icon?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{value}</h3>
        <div className={`flex items-center text-xs font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {positive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  );
}

function ControlToggle({ label, status, active }: { label: string, status: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
        <p className={`text-xs mt-0.5 ${active ? 'text-emerald-500' : 'text-amber-500'}`}>{status}</p>
      </div>
      <button className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${active ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`}></span>
      </button>
    </div>
  );
}

function AuditRow({ staff, action, target, time }: { staff: string, action: string, target: string, time: string }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 last:pb-0">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {staff} <span className="text-zinc-500 dark:text-zinc-400 font-normal">performed</span> {action}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Target: {target}</p>
      </div>
      <span className="text-xs text-zinc-400">{time}</span>
    </div>
  );
}
