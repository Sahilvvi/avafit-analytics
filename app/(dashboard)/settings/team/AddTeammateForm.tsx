"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { addTeammateAction, type AddTeammateState } from "./actions";

const initialState: AddTeammateState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
    >
      <UserPlus size={15} />
      {pending ? "Adding…" : "Add teammate"}
    </button>
  );
}

export default function AddTeammateForm() {
  const [state, formAction] = useActionState(addTeammateAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        formAction(fd);
        formRef.current?.reset();
      }}
      className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <div className="space-y-1.5">
        <label className="eyebrow block">Name</label>
        <input name="name" required className="field h-10" placeholder="Jane Doe" />
      </div>
      <div className="space-y-1.5">
        <label className="eyebrow block">Email</label>
        <input name="email" type="email" required className="field h-10" placeholder="jane@opquorum.com" />
      </div>
      <div className="space-y-1.5">
        <label className="eyebrow block">Temporary password</label>
        <input name="password" type="password" required minLength={8} className="field h-10" placeholder="At least 8 characters" />
      </div>
      <SubmitButton />

      {state.error ? (
        <p className="col-span-full flex items-center gap-2 rounded-lg border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
          <AlertCircle size={15} /> {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="col-span-full flex items-center gap-2 rounded-lg border border-status-good/30 bg-status-good/10 px-3 py-2 text-sm text-status-good">
          <CheckCircle2 size={15} /> Teammate added — share the password with them so they can sign in and change it.
        </p>
      ) : null}
    </form>
  );
}
