"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ArrowsClockwise } from "@phosphor-icons/react";
import { BvnModificationHistoryStats, BvnModificationStatusFilter } from "./BvnModificationHistoryStats";
import { BvnModificationHistoryTable } from "./BvnModificationHistoryTable";
import { BvnModificationRecord } from "./BvnModificationDetailsModal";

export default function BvnModificationHistory() {
  const [requests, setRequests] = useState<BvnModificationRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BvnModificationStatusFilter>("ALL");

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bvn/modification/history", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRequests(data.requests || []);
          if (data.stats) {
            setStats(data.stats);
          } else {
            const reqs: BvnModificationRecord[] = data.requests || [];
            setStats({
              total: reqs.length,
              pending: reqs.filter((r) => r.status === "PENDING").length,
              processing: reqs.filter((r) => r.status === "PROCESSING").length,
              completed: reqs.filter((r) => r.status === "COMPLETED").length,
              rejected: reqs.filter((r) => r.status === "REJECTED").length,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load BVN modification history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      {/* 5 Filter Metric Cards */}
      <BvnModificationHistoryStats
        stats={stats}
        activeFilter={activeStatus}
        onFilterChange={(filter) => setActiveStatus(filter)}
      />

      {/* Interactive History Table */}
      <BvnModificationHistoryTable
        requests={requests}
        isLoading={isLoading}
        onRefresh={fetchHistory}
        activeStatus={activeStatus}
        onStatusChange={(status) => setActiveStatus(status)}
      />
    </div>
  );
}
