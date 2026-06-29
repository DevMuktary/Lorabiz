import { MagnifyingGlass, Archive } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import ActionMenu from "./ActionMenu";

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
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mt-8 transition-colors duration-300">
      
      {/* Toolbar with Full Filters */}
      <div className="p-5 border-b border-border flex flex-col lg:flex-row justify-between gap-4 bg-secondary/30">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by proposed name..." 
            className="pl-11 pr-4 h-12 border-2 border-border rounded-xl text-sm font-medium focus:ring-primary focus:border-primary w-full outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} 
              className="h-12 px-4 rounded-xl border-2 border-border bg-background font-bold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
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
              className="h-12 px-4 rounded-xl border-2 border-border bg-background font-bold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNSUBMITTED">Not Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="QUERIED">Queried</option>
              <option value="APPROVED">Approved</option>
            </select>
        </div>
      </div>

      {/* FIXED: Added 'pb-24' here so the dropdown on the last row never gets cut off! */}
      <div className={`w-full overflow-x-auto pb-24 transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Business Name</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Entity Type</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Last Updated</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Status</th>
              <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data?.tableData?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" weight="duotone" />
                  <p className="font-bold text-lg text-foreground">No records found</p>
                  <p className="text-sm font-medium mt-1">Try adjusting your filters or search term.</p>
                </td>
              </tr>
            ) : (
              data?.tableData?.map((reg: any) => (
                <tr key={reg.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-black text-foreground">{reg.proposedName || "Unnamed Registration"}</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{reg.id.slice(0,8)}</p>
                  </td>
                  <td className="px-6 py-5 font-bold text-muted-foreground">
                    {reg._appType === 'BUSINESS_NAME' ? 'Business Name' : 
                     reg._appType === 'LLC' ? 'Company (LLC)' : 
                     reg._appType === 'NGO' ? 'Incorporated Trustees' : 'Unknown'}
                  </td>
                  <td className="px-6 py-5 font-bold text-muted-foreground">
                    {new Date(reg.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase
                      ${reg.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}
                      ${reg.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : ''}
                      ${reg.status === 'QUERIED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : ''}
                      ${reg.status === 'UNSUBMITTED' ? 'bg-secondary text-muted-foreground' : ''}
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
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/30">
          <span className="text-sm font-bold text-muted-foreground">
            Page <span className="text-foreground">{page}</span> of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button 
              onClick={() => setPage((p: number) => Math.max(1, p - 1))} 
              disabled={page === 1} 
              variant="outline" 
              className="h-9 font-bold rounded-xl border-2 border-border text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Prev
            </Button>
            <Button 
              onClick={() => setPage((p: number) => Math.min(data.totalPages, p + 1))} 
              disabled={page === data.totalPages} 
              variant="outline" 
              className="h-9 font-bold rounded-xl border-2 border-border text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
