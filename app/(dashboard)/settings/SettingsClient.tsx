"use client";

import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { PageHead, Toggle } from "@/components/halcyon/ui";
import ProfileForm from "./ProfileForm";
import type { AuditLogEntry } from "@/lib/types";

const ACTION_LABEL: Record<AuditLogEntry["action"], string> = {
  login: "Signed in",
  login_failed: "Failed sign-in attempt",
  logout: "Signed out",
  idle_logout: "Auto signed out · idle",
  hidden_logout: "Auto signed out · tab hidden",
};

export default function SettingsPage({ auditLog }: { auditLog: AuditLogEntry[] }) {
  const { admin, prefs, setPref, signOut, go } = useDash();

  return (
    <div className="hc-page">
      <PageHead kicker="ACCOUNT" title="Profile & settings" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: "1.3 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="hc-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#E2E8F0,#CBD5E1)",
                  border: "1px solid rgba(15,23,42,0.132)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "600 18px var(--hc-sans)",
                  boxShadow: "0 0 30px -6px rgba(67, 52, 220,.4)",
                }}
              >
                {admin.name.slice(0, 1).toUpperCase()}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{admin.name}</span>
                <span style={{ fontSize: 13, color: "#5B6577", textTransform: "capitalize" }}>{admin.role} · AVA Fit Admin</span>
              </div>
            </div>
            <ProfileForm />
          </div>

          <div className="hc-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="hc-h3">Team access</h3>
              <span className="hc-sub">Everyone with sign-in access to this admin dashboard</span>
            </div>
            <button className="hc-btn" style={{ alignSelf: "flex-start" }} onClick={() => go("/settings/team")}>
              Manage team
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </div>

        <div style={{ flex: "1 1 360px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="hc-card" style={{ padding: 12 }}>
            <PrefRow label="Compact tables" desc="Tighter row height across every table" on={prefs.compact} onToggle={() => setPref("compact", !prefs.compact)} />
          </div>
          <div className="hc-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="hc-h3">Security</h3>
              <span className="hc-sub">Signed in as {admin.email || admin.name} on this device</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="hc-btn hc-btn-danger" onClick={signOut}>
                <Icon name="logout" size={15} />
                Sign out
              </button>
            </div>
          </div>

          <div className="hc-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="hc-h3">Recent activity</h3>
              <span className="hc-sub">Every sign-in and sign-out on this dashboard, view-only</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {auditLog.length === 0 ? (
                <span style={{ fontSize: 13, color: "#64748B" }}>Nothing logged yet.</span>
              ) : (
                auditLog.map((e) => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(15,23,42,0.055)" }}>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{ACTION_LABEL[e.action]}</span>
                      <span style={{ fontSize: 12, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.admin_email}{e.ip ? ` · ${e.ip}` : ""}</span>
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrefRow({ label, desc, on, onToggle }: { label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 12px", border: 0, borderRadius: 12, background: "transparent", color: "#0F172A", textAlign: "left", cursor: "pointer", transition: "background .2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.044)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ font: "500 14px var(--hc-sans)" }}>{label}</span>
        <span style={{ font: "400 12.5px var(--hc-sans)", color: "#64748B" }}>{desc}</span>
      </span>
      <Toggle on={on} />
    </button>
  );
}
