import { redirect } from "next/navigation";
import { fetchAll } from "@/lib/data";
import { getAdminById } from "@/lib/adminAuth";
import { getSession } from "@/lib/session";
import { toSnapshot } from "@/lib/halcyon/model";
import type { AdminInfo } from "@/lib/halcyon/types";
import { DashProvider } from "@/components/halcyon/store";
import Shell from "@/components/halcyon/Shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ patients, sessions, authUsers }, adminRow] = await Promise.all([fetchAll(), getAdminById(session.adminId)]);

  const admin: AdminInfo = adminRow
    ? { id: adminRow.id, name: adminRow.name, email: adminRow.email, role: adminRow.role }
    : { id: session.adminId, name: session.name, email: "", role: "admin" };

  const snapshot = toSnapshot(patients, sessions, authUsers, Date.now());

  return (
    <DashProvider snapshot={snapshot} admin={admin}>
      <Shell>{children}</Shell>
    </DashProvider>
  );
}
