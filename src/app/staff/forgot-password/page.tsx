import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Hasmmat Cleaning Service",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const resetSessionRequired = params.error === "reset-session-required";
  const resetLinkExpired = params.error === "reset-link-expired";

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your staff email address and we will send secure reset instructions if the account exists."
    >
      {resetLinkExpired ? (
        <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          That password reset link has expired or was already used. Request a
          new link below.
        </p>
      ) : resetSessionRequired ? (
        <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          That password reset session is missing or has expired. Request a new
          link.
        </p>
      ) : null}
      <ForgotPasswordForm />
      <Link
        href="/staff/login"
        className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-rose-700 hover:text-rose-600"
      >
        Back to staff login
      </Link>
    </AuthShell>
  );
}
