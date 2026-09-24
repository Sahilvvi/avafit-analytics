import { recentAuditLog } from "@/lib/adminAuth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const auditLog = await recentAuditLog(20);
  return <SettingsClient auditLog={auditLog} />;
}
