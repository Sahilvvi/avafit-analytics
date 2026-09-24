import { listTeam } from "@/lib/adminAuth";
import { getSession } from "@/lib/session";
import AddTeammateForm from "./AddTeammateForm";
import TeamTable from "./TeamTable";

export default async function TeamSettingsPage() {
  const [admins, session] = await Promise.all([listTeam(), getSession()]);

  return (
    <div className="hc-page">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="hc-kicker">SETTINGS</span>
        <h1 className="hc-h1">Team</h1>
        <span className="hc-sub">Everyone with sign-in access to this admin dashboard.</span>
      </div>
      <AddTeammateForm />
      <TeamTable admins={admins} currentId={session?.adminId} />
    </div>
  );
}
