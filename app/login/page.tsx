import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/adminAuth";
import { BRAND, Orb } from "@/components/halcyon/ui";
import LoginForm from "./LoginForm";
import PressureField from "./PressureField";

function BrandRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Orb size={28} />
      <span className="hc-brand" style={{ fontSize: 16 }}>{BRAND}</span>
      <span style={{ font: "500 10px var(--hc-mono)", letterSpacing: ".08em", color: "#8C909B", padding: "2px 6px", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 5, background: "rgba(255,255,255,0.03)" }}>ADMIN</span>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await needsSetup()) {
    redirect("/setup");
  }
  const params = await searchParams;

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", animation: "hcFadeIn .8s ease both" }}>
      <div
        className="hc-login-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: 620,
          padding: "40px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 32,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "radial-gradient(700px 500px at 30% 45%, rgba(128,131,255,0.10), transparent 70%)",
        }}
      >
        <div style={{ animation: "hcFadeUp .7s .05s both" }}>
          <BrandRow />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 44, flexWrap: "wrap" }}>
          {/* Glass "device" panel holding the live pressure map */}
          <div
            style={{
              position: "relative",
              width: 248,
              flex: "none",
              padding: 16,
              borderRadius: 22,
              background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 40px 80px -30px rgba(0,0,0,0.8), 0 0 80px -20px rgba(128,131,255,0.25)",
              backdropFilter: "blur(24px)",
              animation: "hcFadeUp 1s .15s cubic-bezier(.2,.8,.2,1) both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span className="hc-eyebrow" style={{ color: "#8C909B" }}>Socket map</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, font: "500 10px var(--hc-mono)", letterSpacing: ".08em", color: "#7FE0B4" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3ECF8E", animation: "hcPulse 2s infinite" }} />
                LIVE
              </span>
            </div>
            <div style={{ height: 300 }}>
              <PressureField />
            </div>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "500 10px var(--hc-mono)", color: "#5E626D" }}>LOW</span>
              <span style={{ flex: 1, height: 4, borderRadius: 4, background: "linear-gradient(90deg,#16171F,#343682,#8083FF,#C488FF,#FFB078,#FFF4E6)" }} />
              <span style={{ font: "500 10px var(--hc-mono)", color: "#5E626D" }}>HIGH</span>
            </div>
          </div>

          <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16, animation: "hcFadeUp 1s .3s cubic-bezier(.2,.8,.2,1) both" }}>
            <span className="hc-eyebrow" style={{ color: "#9A9CFF" }}>Prosthetic fit intelligence</span>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(30px,3.2vw,44px)",
                lineHeight: 1.06,
                fontWeight: 600,
                letterSpacing: "-.04em",
                background: "linear-gradient(180deg,#FFFFFF 35%,rgba(237,238,242,.55))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Every patient, every session, in one calm view.
            </h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#8C909B", maxWidth: 380 }}>
              Patients, pressure sessions and tester activity from the AVA Fit iOS and desktop apps — synced from Supabase as it happens.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 20px", font: "500 11px var(--hc-mono)", letterSpacing: ".04em", color: "#5E626D", whiteSpace: "nowrap", animation: "hcFadeUp 1s .45s both" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3ECF8E" }} />
            Encrypted in transit
          </span>
          <span>Server-side access only</span>
          <span>Audit-logged sign-ins</span>
        </div>
      </div>

      <div className="hc-login-formwrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative" }}>
        <div className="hc-login-mobile-brand" style={{ alignItems: "center", marginBottom: 28, width: "100%", maxWidth: 400 }}>
          <BrandRow />
        </div>
        <LoginForm next={params.next ?? "/"} />
      </div>
    </div>
  );
}
