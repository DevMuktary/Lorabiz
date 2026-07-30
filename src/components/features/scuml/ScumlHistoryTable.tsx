// src/components/features/scuml/ScumlHistoryTable.tsx
"use client";

import { FileText, Clock, SpinnerGap, CheckCircle, DownloadSimple } from "@phosphor-icons/react";
import { format } from "date-fns";

type ScumlRecord = {
  id: string;
  companyName: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED";
  createdAt: string;
  finalCertificateUrl?: string | null;
};

export default function ScumlHistoryTable({ history, isLoading }: { history: ScumlRecord[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center justify-center">
        <SpinnerGap className="h-8 w-8 text-primary animate-spin mb-2" />
        <p className="text-sm text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <FileText className="h-10 w-10 text-muted-foreground opacity-50 mb-3" />
        <p className="text-sm text-muted-foreground">You have not submitted any SCUML applications yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-secondary/50 border-b border-border">
          <tr>
            <th className="px-6 py-4 font-bold text-muted-foreground">Date</th>
            <th className="px-6 py-4 font-bold text-muted-foreground">Company Name</th>
            <th className="px-6 py-4 font-bold text-muted-foreground">Type</th>
            <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
            <th className="px-6 py-4 font-bold text-muted-foreground text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {history.map((item) => (
            <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
              <td className="px-6 py-4 text-muted-foreground">
                {format(new Date(item.createdAt), "MMM dd, yyyy")}
              </td>
              <td className="px-6 py-4 font-bold text-foreground">
                {item.companyName}
              </td>
              <td className="px-6 py-4">
                <span className="bg-secondary px-2.5 py-1 rounded-md text-xs font-bold text-muted-foreground">
                  {item.type.replace("_", " ")}
                </span>
              </td>
              <td className="px-6 py-4">
                {item.status === "PENDING" && (
                  <span className="inline-flex items-center gap-1.5 text-yellow-600 bg-yellow-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                    <Clock weight="fill" className="h-3.5 w-3.5" /> Pending
                  </span>
                )}
                {item.status === "PROCESSING" && (
                  <span className="inline-flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                    <SpinnerGap className="h-3.5 w-3.5 animate-spin" /> Processing
                  </span>
                )}
                {item.status === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-green-500/20">
                    <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Completed
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {item.status === "COMPLETED" && item.finalCertificateUrl ? (
                  <a 
                    href={item.finalCertificateUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
                  >
                    <DownloadSimple weight="bold" className="h-4 w-4" />
                    Certificate
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground italic">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
