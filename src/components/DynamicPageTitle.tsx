"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DynamicPageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    let title = "Lorabiz Dashboard";
    
    // Admin (MDS) Pages
    if (pathname.includes('/mds/dashboard/orders/cac')) title = "CAC Pipeline | Lorabiz MDS";
    else if (pathname.includes('/mds/dashboard/orders/scuml')) title = "SCUML Pipeline | Lorabiz MDS";
    else if (pathname.includes('/mds/dashboard/orders/tax-id')) title = "Tax ID Pipeline | Lorabiz MDS";
    else if (pathname.includes('/mds/dashboard/orders/airtime')) title = "Airtime Log | Lorabiz MDS";
    else if (pathname.includes('/mds/dashboard/settings')) title = "Global Settings | Lorabiz MDS";
    else if (pathname.includes('/mds/dashboard/marketing')) title = "Marketing & Referrals | Lorabiz MDS";
    else if (pathname === '/quadrox-lorabiz-team/mds/dashboard') title = "Admin Overview | Lorabiz MDS";
    
    // User Dashboard Pages
    else if (pathname.includes('/dashboard/cac')) title = "CAC Services | Lorabiz";
    else if (pathname.includes('/dashboard/scuml/history')) title = "SCUML History | Lorabiz";
    else if (pathname.includes('/dashboard/scuml')) title = "SCUML Registration | Lorabiz";
    else if (pathname.includes('/dashboard/tax-id/history')) title = "Tax ID History | Lorabiz";
    else if (pathname.includes('/dashboard/tax-id')) title = "Tax ID Generation | Lorabiz";
    else if (pathname.includes('/dashboard/nin/slips') || pathname.includes('/dashboard/tools/nin-slip')) title = "NIN Slip Verification | Lorabiz";
    else if (pathname.includes('/dashboard/nin')) title = "NIN Identity Services | Lorabiz";
    else if (pathname.includes('/dashboard/transactions')) title = "Transaction History | Lorabiz";
    else if (pathname.includes('/dashboard/wallet')) title = "My Wallet | Lorabiz";
    else if (pathname.includes('/dashboard/referrals')) title = "Partner Program | Lorabiz";
    else if (pathname.includes('/dashboard/settings')) title = "Account Settings | Lorabiz";
    else if (pathname === '/dashboard/pricing') title = "Pricing | Lorabiz";
    else if (pathname === '/dashboard') title = "My Dashboard | Lorabiz";
    
    // Set the browser tab title
    document.title = title;
  }, [pathname]);

  return null; // This component is invisible!
}
