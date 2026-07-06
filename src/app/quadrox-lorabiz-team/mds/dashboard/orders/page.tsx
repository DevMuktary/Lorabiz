"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, XCircle, FolderOpen, ArrowRight, Layers } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Global Order Pipeline</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">High-level overview of all processing workflows across the platform.</p>
      </div>

      {/* 1. The 4 Global Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Pending Jobs" 
          value={global.pending} 
          icon={<Clock size={20} className="text-amber-500" />} 
          colorClass="border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Completed Jobs" 
          value={global.completed} 
          icon={<CheckCircle2 size={20} className="text-emerald-500" />} 
          colorClass="border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Queried Jobs" 
          value={global.queried} 
          icon={<AlertCircle size={20} className="text-indigo-500" />} 
          colorClass="border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/5"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Failed Jobs" 
          value={global.failed} 
          icon={<XCircle size={20} className="text-red-500" />} 
          colorClass="border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5"
          isLoading={isLoading}
        />
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* 2. Service Hub (The Folders) */}
      <div>
        <div className="flex items-center mb-6">
          <Layers className="text-zinc-400 mr-2" size={20} />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Service Directories</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse"></div>
            <div className="h-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    <div className={`p-5 rounded-xl border ${colorClass} transition-colors`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
        {icon}
      </div>
      {isLoading ? (
        <div className="w-16 h-8 bg-zinc-200/50 dark:bg-zinc-800 rounded animate-pulse mt-2"></div>
      ) : (
        <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">{value.toLocaleString()}</h3>
      )}
    </div>
  );
}

function ServiceFolderCard({ service }: { service: any }) {
  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 mr-4">
            <FolderOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{service.name}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{service.description}</p>
          </div>
        </div>
      </div>

      {/* Mini Metrics Ribbon inside the folder */}
      <div className="grid grid-cols-4 gap-2 mb-6 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
        <div className="text-center border-r border-zinc-200 dark:border-zinc-800 last:border-0">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Pending</p>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{service.metrics.pending}</p>
        </div>
        <div className="text-center border-r border-zinc-200 dark:border-zinc-800 last:border-0">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Completed</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{service.metrics.completed}</p>
        </div>
        <div className="text-center border-r border-zinc-200 dark:border-zinc-800 last:border-0">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Queried</p>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">{service.metrics.queried}</p>
        </div>
        <div className="text-center border-r border-zinc-200 dark:border-zinc-800 last:border-0">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Failed</p>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">{service.metrics.failed}</p>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex gap-2">
          {service.subCategories.map((sub: string, idx: number) => (
            <span key={idx} className="text-[10px] font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded">
              {sub}
            </span>
          ))}
        </div>
        <Link 
          href={service.href}
          className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          Open Directory <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
