import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/adminAuth";
import { Icon } from "@/components/halcyon/icons";
import { BRAND, BRAND_TAG } from "@/components/halcyon/ui";
import LoginForm from "./LoginForm";

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
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", background: "var(--hc-bg)", animation: "hcFadeIn .6s ease both" }}>
      <div className="hc-login-hero" style={{ position: "relative", overflow: "hidden", minHeight: 560, padding: "44px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid rgba(15,23,42,0.066)", background: "#EEF2F8" }}>
        <div className="hc-mesh-a" style={{ width: 520, height: 520, left: -120, top: -80, background: "radial-gradient(circle,rgba(10,165,194,.22),transparent 65%)", filter: "blur(20px)", animation: "hcDrift 14s ease-in-out infinite" }} />
        <div className="hc-mesh-a" style={{ width: 460, height: 460, right: -140, bottom: -120, background: "radial-gradient(circle,rgba(16,185,129,.16),transparent 65%)", filter: "blur(20px)", animation: "hcDrift 18s ease-in-out infinite reverse" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(15,23,42,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.028) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(circle at 40% 45%,#000,transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle at 40% 45%,#000,transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, animation: "hcFadeUp .7s .1s both" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#E8FDFF,#0AA5C2 45%,#0E6B78)", boxShadow: "0 0 18px rgba(10,165,194,.6)" }} />
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-.01em" }}>{BRAND}</span>
          <span style={{ font: "500 11px var(--hc-mono)", color: "#64748B", marginLeft: 4, padding: "3px 7px", border: "1px solid rgba(15,23,42,0.11)", borderRadius: 6 }}>{BRAND_TAG}</span>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 30, maxWidth: 460 }}>
          <div style={{ position: "relative", width: 112, height: 112, animation: "hcFadeUp .9s .2s cubic-bezier(.2,.8,.2,1) both" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "conic-gradient(from 0deg,transparent,#0AA5C2,#10B981,transparent 70%)",
                animation: "hcSpin 6s linear infinite",
                mask: "radial-gradient(circle,transparent 52px,#000 53px)",
                WebkitMask: "radial-gradient(circle,transparent 52px,#000 53px)",
              }}
            />
            <div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#E8FDFF,#0AA5C2 40%,#0A4F59 85%)", animation: "hcBreathe 4s ease-in-out infinite" }} />
            <span style={{ position: "absolute", left: 38, top: 38, color: "#06232A" }}>
              <Icon name="activity" size={36} sw={2.4} />
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "hcFadeUp .9s .35s cubic-bezier(.2,.8,.2,1) both" }}>
            <h1 style={{ margin: 0, fontSize: "clamp(34px,4vw,50px)", lineHeight: 1.04, fontWeight: 600, letterSpacing: "-.035em" }}>Every patient, every session, in one calm view.</h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "#5B6577", maxWidth: 400 }}>
              Patients, logging sessions and tester activity from the AVA Fit iOS and desktop apps, synced from Supabase as it happens.
            </p>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, font: "500 12px var(--hc-mono)", color: "#5B6577", animation: "hcFadeUp .9s .5s both" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981", animation: "hcPulse 2s infinite" }} />
          Server-side only · no data leaves this device unencrypted
        </div>
      </div>

      <div className="hc-login-formwrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative" }}>
        <div className="hc-login-mobile-brand" style={{ alignItems: "center", gap: 10, marginBottom: 28, width: "100%", maxWidth: 380 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#E8FDFF,#0AA5C2 45%,#0E6B78)", boxShadow: "0 0 18px rgba(10,165,194,.6)" }} />
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-.01em" }}>{BRAND}</span>
          <span style={{ font: "500 11px var(--hc-mono)", color: "#64748B", marginLeft: 4, padding: "3px 7px", border: "1px solid rgba(15,23,42,0.11)", borderRadius: 6 }}>{BRAND_TAG}</span>
        </div>
        <LoginForm next={params.next ?? "/"} />
      </div>
    </div>
  );
}
