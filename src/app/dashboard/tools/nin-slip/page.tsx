import { redirect } from "next/navigation";

export default function LegacyNinSlipRedirect() {
  redirect("/dashboard/nin/slips");
}
