import { MagnifyingGlass, Archive } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import ActionMenu from "../features/cac/new-incorporation/ActionMenu";

interface TableProps {
  data: any;
  loading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (s: string) => void;
  onExecuteAction: (action: string, id: string) => void;
}

export default function RegistrationsTable({ 
  data, loading, page, setPage, search, setSearch, 
  statusFilter, setStatusFilter, typeFilter, setTypeFilter, onExecuteAction 
}: TableProps) {
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mt-8">
      
      {/* Toolbar with Full Filters */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between gap-4 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by proposed name..." 
            className="pl-11 pr-4 h-12 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-[#ff3f7a] focus:border-[#ff3f7a] w-full outline-none transition-all bg-white"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} 
              className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-600 outline-none focus:border-[#ff3f7a]"
            >
              <option value="ALL">All Entities</option>
              <option value="BUSINESS_NAME">Business Name</option>
              <option value="LTD">Limited Liability (LTD)</option>
              <option value="LTD_GTE">Company Ltd by Guarantee</option>
              <option value="TRUSTEE">Incorporated Trustee</option>
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} 
              className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-600 outline-none focus:border-[#ff3f7a]"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNSUBMITTED">Not Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="QUERIED">Queried</option>
              <option value="APPROVED">Approved</option>
            </select>
        </div>
      </div>

      <div className={`w-full overflow-x-auto transition-opacity duration-200 min-h-[350px] ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Business Name</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Entity Type</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Last Updated</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Status</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.tableData?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                  <Archive className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="font-bold text-lg text-slate-700">No records found</p>
                  <p className="text-sm font-medium mt-1">Try adjusting your filters or search term.</p>
                </td>
              </tr>
            ) : (
              data?.tableData?.map((reg: any) => (
                <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-black text-slate-900">{reg.proposedName}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-1 uppercase">{reg.id.slice(0,8)}</p>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600">
                    {reg.businessType === 'BUSINESS_NAME' ? 'Business Name' : reg.businessType}
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-500">{new Date(reg.updatedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase
                      ${reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${reg.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : ''}
                      ${reg.status === 'QUERIED' ? 'bg-red-100 text-red-700' : ''}
                      ${reg.status === 'UNSUBMITTED' ? 'bg-slate-100 text-slate-600' : ''}
                    `}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <ActionMenu reg={reg} onExecute={onExecuteAction} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-sm font-bold text-slate-500">
            Page <span className="text-slate-900">{page}</span> of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" className="h-9 font-bold rounded-xl border-2 border-slate-200 text-slate-600">Prev</Button>
            <Button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} variant="outline" className="h-9 font-bold rounded-xl border-2 border-slate-200 text-slate-600">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
