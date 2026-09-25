import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { needsSetup } from "@/lib/adminAuth";
import { Orb, BRAND, BRAND_TAG } from "@/components/halcyon/ui";
import SetupForm from "./SetupForm";

/** Reachable only while `admin_users` is empty — once the first account
 *  exists this permanently redirects to /login. There is no public sign-up
 *  anywhere else in the app; teammates after the first are added from
 *  Settings → Team by an already-signed-in admin. */
export default async function SetupPage() {
  if (!(await needsSetup())) {
    redirect("/login");
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", background: "var(--hc-bg)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <Orb />
          <span className="hc-brand" style={{ fontSize: 17 }}>{BRAND}</span>
          <span style={{ font: "500 11px var(--hc-mono)", color: "#64748B", marginLeft: 4, padding: "3px 7px", border: "1px solid rgba(15,23,42,0.11)", borderRadius: 6 }}>{BRAND_TAG}</span>
        </div>

        <p className="hc-eyebrow" style={{ marginBottom: 8, color: "var(--hc-cyan)" }}>
          First-time setup
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-.02em" }}>Create the first admin account</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#5B6577", lineHeight: 1.5 }}>
          No one has signed in to this dashboard yet. Create your account to get started — you can add teammates afterwards from Settings.
        </p>

        <div style={{ marginTop: 28 }}>
          <SetupForm />
        </div>

        <div style={{ marginTop: 28, display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", background: "#FFFFFF", padding: 14, fontSize: 12, lineHeight: 1.5, color: "#64748B" }}>
          <ShieldCheck size={15} style={{ marginTop: 1, flex: "none", color: "var(--hc-cyan)" }} />
          <span>This page disables itself the moment an account exists — it will redirect to sign-in after this.</span>
        </div>
      </div>
    </main>
  );
}
