import { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Executive Control | Quadrox LoraBiz",
  description: "Administrative dashboard and operational control plane for Quadrox LoraBiz.",
};

export default async function MdsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hard Server-Side Check
  const session: any = await getServerSession(authOptions);

  // If there is no session or the user is NOT an admin, kick them out immediately
  if (!session || session?.user?.role !== "ADMIN") {
    redirect("/quadrox-lorabiz-team/mds/login");
  }

  return <ClientLayout>{children}</ClientLayout>;
}
