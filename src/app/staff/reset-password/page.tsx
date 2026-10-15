import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose New Password | Hasmmat Cleaning Service",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const supabase = await createClient({ persistence: "session" });
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/staff/forgot-password?error=reset-session-required");
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Your new password will replace the previous password on this staff account."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
