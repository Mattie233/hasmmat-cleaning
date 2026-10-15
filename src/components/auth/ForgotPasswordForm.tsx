"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { initialAuthActionState } from "@/lib/auth/action-state";
import SubmitButton from "./SubmitButton";

export default function ForgotPasswordForm() {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-medium text-slate-800">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
        />
      </label>
      {state.message ? (
        <p
          role="status"
          className={`rounded-2xl border p-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        idleLabel="Send reset instructions"
        pendingLabel="Sending…"
      />
    </form>
  );
}
