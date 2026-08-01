"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, XCircle, FolderOpen, ArrowRight, Layers, Zap } from 'lucide-react';

export default function GlobalOrderPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const res = await fetch('/api/mds/pipeline');
        if (!res.ok) throw new Error("Failed to fetch pipeline");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Pipeline error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipeline();
  }, []);

  const global = data?.global || { pending: 0, completed: 0, queried: 0, failed: 0 };
  const services = data?.services || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Global Order Pipeline</h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">High-level operations overview across all platform service modules.</p>
      </div>

      {/* 1. The 4 Global Cards - Upscaled & Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Awaiting Action" 
          value={global.pending} 
          icon={<Clock size={22} className="text-amber-500" />} 
          colorClass="border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Completed Jobs" 
          value={global.completed} 
          icon={<CheckCircle2 size={22} className="text-emerald-500" />} 
          colorClass="border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Queried / Client Hold" 
          value={global.queried} 
          icon={<AlertCircle size={22} className="text-indigo-500" />} 
          colorClass="border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm shadow-indigo-500/10"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Failed / Rejected" 
          value={global.failed} 
          icon={<XCircle size={22} className="text-rose-500" />} 
          colorClass="border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 shadow-sm shadow-rose-500/10"
          isLoading={isLoading}
        />
      </div>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* 2. Service Hub (The Folders) */}
      <div>
        <div className="flex items-center mb-6">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
            <Layers className="text-slate-500 dark:text-slate-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Active Service Directories</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {services.map((service: any) => (
              <ServiceFolderCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function MetricCard({ title, value, icon, colorClass, isLoading }: { title: string, value: number, icon: React.ReactNode, colorClass: string, isLoading: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${colorClass} transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300">{title}</p>
        {icon}
      </div>
      {isLoading ? (
        <div className="w-20 h-10 bg-black/5 dark:bg-white/10 rounded animate-pulse mt-2"></div>
      ) : (
        <h3 className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{value.toLocaleString()}</h3>
      )}
    </div>
  );
}

function ServiceFolderCard({ service }: { service: any }) {
  const isAutomated = service.isAutomated;

  return (
    <div className="group bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all duration-300 flex flex-col h-full cursor-default">
      
      {/* Top Section: Title & Description */}
      <div className="flex items-start justify-between mb-8 flex-1">
        <div className="flex items-start">
          <div className={`p-4 rounded-xl mr-5 shrink-0 shadow-inner ${isAutomated ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'}`}>
            {isAutomated ? <Zap size={28} /> : <FolderOpen size={28} />}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
              {service.name}
              {isAutomated && <span className="ml-3 text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 rounded-md uppercase tracking-widest shadow-sm">Automated</span>}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed max-w-md">{service.description}</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Metrics Ribbon */}
      <div className={`grid gap-3 mb-8 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-inner ${isAutomated ? "grid-cols-2" : "grid-cols-4"}`}>
        
        {!isAutomated && (
          <div className="text-center border-r border-slate-200 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Action Req.</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{service.metrics.pending}</p>
          </div>
        )}

        <div className={`text-center border-r border-slate-200 dark:border-slate-800 ${isAutomated ? "" : ""}`}>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Completed</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{service.metrics.completed}</p>
        </div>

        {!isAutomated && (
          <div className="text-center border-r border-slate-200 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Queried</p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{service.metrics.queried}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Failed</p>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{service.metrics.failed}</p>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="flex flex-wrap gap-2">
          {service.subCategories.map((sub: string, idx: number) => (
            <span key={idx} className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm">
              {sub}
            </span>
          ))}
        </div>
        <Link 
          href={service.href}
          className="flex items-center text-sm font-black text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors py-2 px-3 bg-teal-50 dark:bg-teal-500/10 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-500/20"
        >
          {isAutomated ? "View Logs" : "Open Directory"} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
