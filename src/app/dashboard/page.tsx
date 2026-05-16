"use client";

import Link from "next/link";
import { 
  Files, 
  HourglassHigh, 
  CheckCircle, 
  Wallet, 
  Plus, 
  ArrowRight,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Mock Data for the UI
const STATS = [
  { label: "Total Registrations", value: "12", icon: Files, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Pending Approvals", value: "3", icon: HourglassHigh, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Approved Businesses", value: "8", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Wallet Balance", value: "₦45,000", icon: Wallet, color: "text-[#ff3f7a]", bg: "bg-[#ff3f7a]/10" },
];

const RECENT_REGISTRATIONS = [
  { id: "REG-8829", name: "TechNova Solutions", type: "Limited Liability Company", date: "May 14, 2026", status: "PENDING" },
  { id: "REG-8828", name: "Adesola Bakeries", type: "Business Name", date: "May 10, 2026", status: "APPROVED" },
  { id: "REG-8827", name: "Greenfield Agro", type: "Business Name", date: "May 02, 2026", status: "APPROVED" },
  { id: "REG-8826", name: "Vanguard Logistics", type: "Limited Liability Company", date: "Apr 28, 2026", status: "REJECTED" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8 pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Here is what is happening with your business registrations.</p>
        </div>
        
        <Link href="/dashboard/new">
          <Button className="h-11 bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 font-medium px-6 flex items-center gap-2">
            <Plus className="h-5 w-5" weight="bold" />
            New Registration
          </Button>
        </Link>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} weight="fill" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header Area */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Registrations</h2>
          
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search business name..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3f7a]/20 focus:border-[#ff3f7a] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold">Business Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Date Submitted</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RECENT_REGISTRATIONS.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{reg.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{reg.id}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{reg.type}</td>
                  <td className="px-6 py-4 text-gray-600">{reg.date}</td>
                  <td className="px-6 py-4">
                    <span className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide
                      ${reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${reg.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : ''}
                      ${reg.status === 'REJECTED' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#ff3f7a] hover:text-[#e02b62] font-semibold text-sm transition-colors flex items-center justify-end gap-1 w-full">
                      View Details
                      <ArrowRight className="h-4 w-4" weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* View All Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
          <Link href="/dashboard/businesses" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            View all registrations
          </Link>
        </div>
      </div>

    </div>
  );
}
