"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/auth/actions";
import { initialAuthActionState } from "@/lib/auth/action-state";
import SubmitButton from "./SubmitButton";

export default function ResetPasswordForm() {
  const [state, action] = useActionState(
    resetPasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-medium text-slate-800">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
        />
      </label>
      <label className="block text-sm font-medium text-slate-800">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
        />
      </label>
      <p className="text-xs leading-5 text-slate-500">
        Use at least 12 characters with uppercase, lowercase, a number and a
        symbol.
      </p>
      {state.message ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton idleLabel="Update password" pendingLabel="Updating…" />
    </form>
  );
}
