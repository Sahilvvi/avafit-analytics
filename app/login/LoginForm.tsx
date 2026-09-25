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
          border: `1px solid ${hasErr ? "rgba(225,29,72,.5)" : focused ? "rgba(67, 52, 220,.55)" : "rgba(15,23,42,0.11)"}`,
          boxShadow: focused ? "0 0 0 4px rgba(67, 52, 220,.1)" : "none",
        }}
      >
        <label
          htmlFor={id}
          style={{
            position: "absolute",
            left: 16,
            top: up ? 10 : "50%",
            transform: up ? "none" : "translateY(-50%)",
            fontSize: up ? 11.5 : 15,
            color: hasErr ? "#E11D48" : up ? "#5B6577" : "#8A94A6",
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
            color: "#0F172A",
            font: `500 15.5px ${type === "password" ? "var(--hc-mono)" : "var(--hc-sans)"}`,
            padding: `24px ${paddingRight ?? 16}px 8px 16px`,
            letterSpacing: type === "password" ? ".02em" : "normal",
          }}
        />
        {rightSlot}
      </div>
      {hasErr && err ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#E11D48", paddingLeft: 4 }}>
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
    <button
      type="submit"
      disabled={pending}
      style={{
        height: 54,
        borderRadius: 14,
        border: 0,
        cursor: pending ? "default" : "pointer",
        background: "linear-gradient(180deg,#6C63FF,#4334DC)",
        color: "#FFFFFF",
        font: "600 15.5px var(--hc-sans)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: "0 10px 30px -10px rgba(67, 52, 220,.7),inset 0 1px 0 rgba(255,255,255,.5)",
        opacity: pending ? 0.85 : 1,
      }}
    >
      {pending ? (
        <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(4,25,29,.25)", borderTopColor: "#FFFFFF", animation: "hcSpin .7s linear infinite" }} />
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Sign in
          <Icon name="arrowRight" size={17} sw={2.2} />
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
    <form action={formAction} noValidate style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 16, animation: "hcFadeUp .8s .25s cubic-bezier(.2,.8,.2,1) both" }}>
      <input type="hidden" name="next" value={next} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--hc-heading)", fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>Welcome back</h2>
        <p style={{ margin: 0, fontSize: 14.5, color: "#5B6577" }}>Sign in with your admin credentials.</p>
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
            style={{ position: "absolute", right: 8, top: 12, width: 36, height: 36, borderRadius: 10, border: 0, background: "transparent", color: "#8A94A6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s,color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.066)")}
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
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, color: "#334155", font: "400 14px var(--hc-sans)", cursor: "pointer", padding: 0 }}
        >
          <span style={{ position: "relative", width: 38, height: 22, borderRadius: 999, background: remember ? "linear-gradient(180deg,#6C63FF,#4334DC)" : "rgba(15,23,42,0.11)", transition: "background .3s cubic-bezier(.2,.8,.2,1)", boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.088)" }}>
            <span style={{ position: "absolute", top: 2, left: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(15,23,42,0.14)", transform: remember ? "translateX(16px)" : "none", transition: "transform .3s cubic-bezier(.3,1.4,.5,1)" }} />
          </span>
          Remember me
        </button>
        {/* The visible toggle above is decorative; this is the one value the
            server action actually reads. */}
        <input type="checkbox" name="remember" checked={remember} onChange={() => {}} style={{ display: "none" }} />
      </div>

      <SubmitButton />
    </form>
  );
}
