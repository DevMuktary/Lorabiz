import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import React from "react";
import MdsDashboardShell from "@/components/layouts/MdsDashboardShell";

export default async function MdsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/quadrox-lorabiz-team/mds/login");
  }

  if ((session.user as any).mfaVerified === false) {
    redirect("/quadrox-lorabiz-team/verify-2fa?callbackUrl=/quadrox-lorabiz-team/mds/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, firstName: true, lastName: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  return (
    <MdsDashboardShell user={user}>
      {children}
    </MdsDashboardShell>
  );
}
