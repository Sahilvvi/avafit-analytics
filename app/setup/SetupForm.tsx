"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { setupAction, type SetupState } from "./actions";

const initialState: SetupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-ink shadow-[0_0_0_1px_rgba(0,212,245,0.4),0_8px_24px_-8px_rgba(0,212,245,0.55)] transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Creating account…
        </>
      ) : (
        <>
          Create account <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export default function SetupForm() {
  const [state, formAction] = useActionState(setupAction, initialState);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="eyebrow block">
          Your name
        </label>
        <input id="name" name="name" type="text" required autoFocus autoComplete="name" className="field h-11" placeholder="Jane Doe" />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="eyebrow block">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field h-11" placeholder="you@opquorum.com" />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="eyebrow block">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="field h-11 pr-11"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-3 hover:text-text-primary"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm" className="eyebrow block">
          Confirm password
        </label>
        <input id="confirm" name="confirm" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" className="field h-11" />
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-lg border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
          <AlertCircle size={15} /> {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
