import { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Executive Control | Quadrox LoraBiz",
  description: "Administrative dashboard and operational control plane for Quadrox LoraBiz.",
};

export default function MdsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
