"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Storefront, Buildings, HandHeart, Plus, Spinner } from "@phosphor-icons/react";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RegistrationsTable from "@/components/dashboard/RegistrationsTable";

const NEW_SERVICES = [
  { 
    name: "Business Name", 
    desc: "Register a sole proprietorship or partnership.", 
    href: "/dashboard/register/business-name", 
    icon: Storefront 
  },
  { 
    name: "Company (LLC)", 
    desc: "Register a Private Limited Liability Company (LTD).", 
    href: "/dashboard/register/llc", 
    icon: Buildings 
  },
  { 
    name: "Incorporated Trustees", 
    desc: "Register an NGO, Church, Club, or Foundation.", 
    href: "/dashboard/register/ngo", 
    icon: HandHeart 
  },
];

export default function NewIncorporationPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the user's registration history and metrics
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-12">
      
      {/* 1. START NEW REGISTRATION SECTION */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-black text-foreground">Start New Registration</h2>
          <p className="text-sm text-muted-foreground mt-1">Select the entity type you wish to register.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {NEW_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link 
                key={service.name}
                href={service.href}
                className="flex flex-col p-5 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                    <Icon weight="duotone" className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Plus weight="bold" className="h-4 w-4" />
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {service.desc}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 2. HISTORY & METRICS SECTION */}
      <section className="space-y-6 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-black text-foreground">Your Applications</h2>
          <p className="text-sm text-muted-foreground mt-1">Track the status of your ongoing and completed registrations.</p>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Spinner className="animate-spin h-8 w-8 mb-4 text-primary" weight="bold" />
            <p className="text-sm font-medium">Loading your applications...</p>
          </div>
        ) : dashboardData ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* If your components expect props differently, adjust them here */}
            {dashboardData.stats && <DashboardMetrics stats={dashboardData.stats} />}
            {dashboardData.tableData && (
              <RegistrationsTable 
                data={dashboardData.tableData} 
                currentPage={dashboardData.currentPage}
                totalPages={dashboardData.totalPages}
                onRefresh={fetchDashboardData} // Optional: trigger refresh after paying/submitting
              />
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground text-sm">
            Failed to load applications.
          </div>
        )}
      </section>

    </div>
  );
}
