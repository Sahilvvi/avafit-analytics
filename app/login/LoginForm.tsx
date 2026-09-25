"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/halcyon/icons";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  hasErr,
  err,
  rightSlot,
  paddingRight,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hasErr?: boolean;
  err?: string;
  rightSlot?: React.ReactNode;
  paddingRight?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const up = focused || value.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        className="hc-login-field"
        style={{
          border: `1px solid ${hasErr ? "rgba(244,96,108,.5)" : focused ? "rgba(128,131,255,.6)" : "rgba(255,255,255,0.09)"}`,
          background: focused ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.03)",
          boxShadow: focused ? "0 0 0 4px rgba(128,131,255,.14), inset 0 1px 0 rgba(255,255,255,0.04)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <label
          htmlFor={id}
          style={{
            position: "absolute",
            left: 15,
            top: up ? 9 : "50%",
            transform: up ? "none" : "translateY(-50%)",
            fontSize: up ? 11 : 14.5,
            color: hasErr ? "#F4606C" : up ? "#8C909B" : "#6B6F7B",
            pointerEvents: "none",
            transition: "all .22s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            background: "transparent",
            border: 0,
            outline: 0,
            color: "#EDEEF2",
            font: `500 14.5px ${type === "password" ? "var(--hc-mono)" : "var(--hc-sans)"}`,
            padding: `22px ${paddingRight ?? 15}px 7px 15px`,
            letterSpacing: type === "password" ? ".02em" : "normal",
          }}
        />
        {rightSlot}
      </div>
      {hasErr && err ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#F4606C", paddingLeft: 4 }}>
          <Icon name="alertCircle" size={13} sw={2.2} />
          {err}
        </div>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="hc-btn-primary" style={{ height: 48, borderRadius: 11, justifyContent: "center", font: "600 14.5px var(--hc-sans)", cursor: pending ? "default" : "pointer", opacity: pending ? 0.85 : 1 }}>
      {pending ? (
        <span style={{ width: 17, height: 17, borderRadius: "50%", border: "2px solid rgba(10,10,12,.2)", borderTopColor: "#0A0A0C", animation: "hcSpin .7s linear infinite" }} />
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Sign in
          <Icon name="arrowRight" size={16} sw={2.2} />
        </span>
      )}
    </button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <form
      action={formAction}
      noValidate
      className="hc-card"
      style={{ width: "100%", maxWidth: 400, padding: "32px 30px 28px", borderRadius: 20, display: "flex", flexDirection: "column", gap: 14, animation: "hcFadeUp .8s .2s cubic-bezier(.2,.8,.2,1) both" }}
    >
      <input type="hidden" name="next" value={next} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", color: "#EDEEF2" }}>Sign in</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: "#8C909B" }}>Use your AVA Fit admin account to continue.</p>
      </div>

      <Field id="cid" name="email" label="Email" type="email" autoComplete="username" hasErr={!!state.error} />
      <Field
        id="cpw"
        name="password"
        label="Password"
        type={showPw ? "text" : "password"}
        autoComplete="current-password"
        hasErr={!!state.error}
        err={state.error}
        paddingRight={52}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            style={{ position: "absolute", right: 8, top: 9, width: 36, height: 36, borderRadius: 9, border: 0, background: "transparent", color: "#5E626D", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s,color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.066)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon name="eye" size={18} sw={1.8} />
          </button>
        }
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 2px 6px" }}>
        <button
          type="button"
          onClick={() => setRemember((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, color: "#C3C6CF", font: "400 13px var(--hc-sans)", cursor: "pointer", padding: 0 }}
        >
          <span style={{ position: "relative", width: 34, height: 20, borderRadius: 999, background: remember ? "#8083FF" : "rgba(255,255,255,0.1)", transition: "background .3s cubic-bezier(.2,.8,.2,1)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
            <span style={{ position: "absolute", top: 2, left: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.45)", transform: remember ? "translateX(14px)" : "none", transition: "transform .3s cubic-bezier(.3,1.4,.5,1)" }} />
          </span>
          Keep me signed in
        </button>
        <span style={{ font: "500 10.5px var(--hc-mono)", letterSpacing: ".06em", color: "#5E626D" }}>4H SESSION</span>
        {/* The visible toggle above is decorative; this is the one value the
            server action actually reads. */}
        <input type="checkbox" name="remember" checked={remember} onChange={() => {}} style={{ display: "none" }} />
      </div>

      <SubmitButton />
    </form>
  );
}
