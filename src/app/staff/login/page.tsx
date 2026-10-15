import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Staff Login | Hasmmat Cleaning Service",
  robots: { index: false, follow: false },
};

const pageMessages: Record<string, string> = {
  "authentication-required": "Sign in to continue to the staff portal.",
  "account-unavailable":
    "This account is unavailable. Contact an administrator.",
  "confirmation-failed":
    "That authentication link is invalid or has expired. Use Forgot password to request a new link if needed.",
  "password-reset": "Your password has been updated. Sign in to continue.",
  "signed-out": "You have been signed out securely.",
};

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code =
    typeof params.error === "string"
      ? params.error
      : typeof params.status === "string"
        ? params.status
        : undefined;
  const message = code ? pageMessages[code] : undefined;

  return (
    <AuthShell
      title="Cleaner Portal"
      description="Sign in with your Hasmmat Cleaning Service staff account."
    >
      {message ? (
        <p className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}
      <LoginForm />
    </AuthShell>
  );
}
