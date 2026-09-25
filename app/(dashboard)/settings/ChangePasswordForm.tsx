"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/halcyon/icons";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initial: ChangePasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="hc-btn" disabled={pending} style={{ opacity: pending ? 0.7 : 1 }}>
      <Icon name="shield" size={14} />
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="hc-btn" style={{ alignSelf: "flex-start" }} onClick={() => setOpen(true)}>
        <Icon name="shield" size={14} />
        Change password
      </button>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label className="hc-field">
        Current password
        <input name="current" type="password" autoComplete="current-password" className="hc-input" required />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <label className="hc-field">
          New password
          <input name="next" type="password" autoComplete="new-password" minLength={8} className="hc-input" required />
        </label>
        <label className="hc-field">
          Confirm new password
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} className="hc-input" required />
        </label>
      </div>
      {state.error ? <p style={{ margin: 0, fontSize: 12.5, color: "#F4606C" }}>{state.error}</p> : null}
      <p style={{ margin: 0, fontSize: 11.5, color: "#6B6F7B" }}>You'll be signed out and asked to sign back in with the new password.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <SubmitButton />
        <button type="button" className="hc-btn" onClick={() => setOpen(false)} style={{ background: "transparent" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
