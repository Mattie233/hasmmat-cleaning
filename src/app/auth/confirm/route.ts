import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { profileSchema } from "@/lib/auth/types";
import { safeAuthDestination } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { logAuthDiagnostic } from "@/lib/auth/diagnostics";

const emailOtpTypes = new Set<EmailOtpType>([
  "email",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const typeValue = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  const requestedDestination = safeAuthDestination(
    request.nextUrl.searchParams.get("next"),
  );

  const isPasswordReset = requestedDestination === "/staff/reset-password";
  const supabaseErrorCode = request.nextUrl.searchParams.get("error_code");
  if (supabaseErrorCode) {
    const expired = supabaseErrorCode === "otp_expired";
    logAuthDiagnostic(
      "auth_callback_failed",
      expired ? "expired_or_reused_link" : "supabase_callback_error",
    );
    return redirectTo(
      request,
      isPasswordReset
        ? "/staff/forgot-password?error=reset-link-expired"
        : "/staff/login?error=confirmation-failed",
    );
  }

  const supabase = await createClient({ persistence: "session" });

  let confirmationError = null;

  if (tokenHash && typeValue && emailOtpTypes.has(typeValue as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeValue as EmailOtpType,
    });
    confirmationError = error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmationError = error;
  } else {
    return redirectTo(request, "/staff/login?error=confirmation-failed");
  }

  if (confirmationError) {
    const expired = confirmationError.code === "otp_expired";
    logAuthDiagnostic(
      "auth_callback_failed",
      expired ? "expired_or_reused_link" : "confirmation_failed",
      confirmationError,
    );
    return redirectTo(
      request,
      isPasswordReset
        ? "/staff/forgot-password?error=reset-link-expired"
        : "/staff/login?error=confirmation-failed",
    );
  }

  if (isPasswordReset) {
    return redirectTo(request, requestedDestination);
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    if (claimsError) {
      logAuthDiagnostic(
        "auth_callback_failed",
        "claims_unavailable",
        claimsError,
      );
    }
    return redirectTo(request, "/staff/login?error=confirmation-failed");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, status")
    .eq("id", userId)
    .maybeSingle();
  const parsedProfile = profileSchema.safeParse(profileData);

  if (
    profileError ||
    !parsedProfile.success ||
    parsedProfile.data.status !== "active"
  ) {
    if (profileError) {
      logAuthDiagnostic(
        "auth_callback_failed",
        "profile_query_failed",
        profileError,
      );
    } else if (!parsedProfile.success) {
      logAuthDiagnostic("auth_callback_failed", "profile_missing_or_invalid");
    } else {
      logAuthDiagnostic("auth_callback_failed", "profile_inactive");
    }
    await supabase.auth.signOut();
    return redirectTo(request, "/staff/login?error=account-unavailable");
  }

  return redirectTo(
    request,
    parsedProfile.data.role === "admin" ? "/admin" : "/staff/jobs",
  );
}
