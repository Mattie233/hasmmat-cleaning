"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "@/lib/auth/actions";
import { initialAuthActionState } from "@/lib/auth/action-state";
import SubmitButton from "./SubmitButton";

export default function LoginForm() {
  const [state, action] = useActionState(signInAction, initialAuthActionState);

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
      <label className="block text-sm font-medium text-slate-800">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
        />
      </label>
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="inline-flex min-h-11 items-center gap-2 text-slate-700">
          <input
            name="remember"
            type="checkbox"
            defaultChecked
            className="h-5 w-5 rounded border-slate-300 accent-rose-700"
          />
          Remember me
        </label>
        <Link
          href="/staff/forgot-password"
          className="font-semibold text-rose-700 hover:text-rose-600"
        >
          Forgot password?
        </Link>
      </div>
      {state.message ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton idleLabel="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}
