"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { saveProfileAction, type SaveProfileState } from "./actions";

const initial: SaveProfileState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="hc-btn-primary" disabled={pending} style={{ opacity: pending ? 0.7 : 1 }}>
      <Icon name="check" size={15} />
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}

export default function ProfileForm() {
  const { admin, toast } = useDash();
  const [state, formAction] = useActionState(saveProfileAction, initial);

  useEffect(() => {
    if (state.success) toast("Profile saved");
  }, [state.success, toast]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <label className="hc-field">
          Name
          <input name="name" defaultValue={admin.name} className="hc-input" required />
        </label>
        <label className="hc-field">
          Email
          <input name="email" type="email" defaultValue={admin.email} className="hc-input" required />
        </label>
        <label className="hc-field">
          Role
          <input value={admin.role} disabled className="hc-input" style={{ opacity: 0.6, cursor: "not-allowed" }} />
        </label>
      </div>
      {state.error ? <p style={{ margin: 0, fontSize: 13, color: "#E11D48" }}>{state.error}</p> : null}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <SaveButton />
      </div>
    </form>
  );
}
