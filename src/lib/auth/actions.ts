"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearSessionPersistence,
  createClient,
  setSessionPersistence,
  type SessionPersistence,
} from "@/lib/supabase/server";
import {
  classifyAuthFailure,
  logAuthDiagnostic,
} from "./diagnostics";
import { profileSchema } from "./types";
import { getSiteUrl } from "./site-url";
import type { AuthActionState } from "./action-state";

const emailSchema = z.email().trim().toLowerCase();
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function signOutAndClearSession(
  supabase: ServerSupabaseClient,
  scope: "global" | "local" = "global",
) {
  let signOutFailed = false;

  try {
    const { error } = await supabase.auth.signOut({ scope });
    if (error) {
      logAuthDiagnostic("sign_out_failed", "sign_out_failed", error);
      signOutFailed = true;
    }
  } catch (error) {
    logAuthDiagnostic("sign_out_failed", "sign_out_failed", error);
    signOutFailed = true;
  }

  if (signOutFailed && scope === "global") {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        logAuthDiagnostic("local_sign_out_failed", "local_sign_out_failed", error);
      }
    } catch (error) {
      logAuthDiagnostic("local_sign_out_failed", "local_sign_out_failed", error);
    }
  }

  await clearSessionPersistence();
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: "Enter a valid email address and password.",
      status: "error",
    };
  }

  const persistence: SessionPersistence =
    formData.get("remember") === "on" ? "persistent" : "session";
  await setSessionPersistence(persistence);

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient({ persistence });
  } catch (error) {
    const category = classifyAuthFailure(error);
    logAuthDiagnostic("sign_in_failed", category, error);
    return {
      message: "Sign-in is temporarily unavailable. Please try again later.",
      status: "error",
    };
  }

  let signInResult: Awaited<
    ReturnType<typeof supabase.auth.signInWithPassword>
  >;
  try {
    signInResult = await supabase.auth.signInWithPassword(parsed.data);
  } catch (error) {
    const category = classifyAuthFailure(error);
    logAuthDiagnostic("sign_in_failed", category, error);
    return {
      message: "Unable to sign in with those details. Please try again.",
      status: "error",
    };
  }

  const { data: signInData, error: signInError } = signInResult;
  if (signInError || !signInData.user) {
    const category = classifyAuthFailure(signInError);
    logAuthDiagnostic("sign_in_failed", category, signInError);
    return {
      message: "Unable to sign in with those details. Please try again.",
      status: "error",
    };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, status")
    .eq("id", signInData.user.id)
    .maybeSingle();

  if (profileError) {
    logAuthDiagnostic("profile_lookup_failed", "profile_query_failed", profileError);
    await signOutAndClearSession(supabase);
    return {
      message: "This account is unavailable. Contact an administrator.",
      status: "error",
    };
  }

  if (!profileData) {
    logAuthDiagnostic("profile_lookup_failed", "profile_missing");
    await signOutAndClearSession(supabase);
    return {
      message: "This account is unavailable. Contact an administrator.",
      status: "error",
    };
  }

  const parsedProfile = profileSchema.safeParse(profileData);
  if (!parsedProfile.success) {
    logAuthDiagnostic("profile_lookup_failed", "profile_invalid");
    await signOutAndClearSession(supabase);
    return {
      message: "This account is unavailable. Contact an administrator.",
      status: "error",
    };
  }

  if (
    parsedProfile.data.id !== signInData.user.id ||
    !signInData.user.email ||
    parsedProfile.data.email.toLowerCase() !== signInData.user.email.toLowerCase()
  ) {
    logAuthDiagnostic("profile_lookup_failed", "profile_identity_mismatch");
    await signOutAndClearSession(supabase);
    return {
      message: "This account is unavailable. Contact an administrator.",
      status: "error",
    };
  }

  if (parsedProfile.data.status !== "active") {
    logAuthDiagnostic("profile_lookup_failed", "profile_inactive");
    await signOutAndClearSession(supabase);
    return {
      message: "This account is unavailable. Contact an administrator.",
      status: "error",
    };
  }

  if (parsedProfile.data.role === "admin") redirect("/admin");
  redirect("/staff/jobs");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));

  if (!parsedEmail.success) {
    return { message: "Enter a valid email address.", status: "error" };
  }

  try {
    const supabase = await createClient({ persistence: "session" });
    const redirectTo = `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(
      "/staff/reset-password",
    )}`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsedEmail.data,
      { redirectTo },
    );
    if (error) {
      logAuthDiagnostic(
        "password_reset_request_failed",
        classifyAuthFailure(error),
        error,
      );
    }
  } catch (error) {
    logAuthDiagnostic(
      "password_reset_request_failed",
      classifyAuthFailure(error),
      error,
    );
  }

  return {
    message:
      "If an account exists for that address, password reset instructions have been sent.",
    status: "success",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const passwordMismatch = parsed.error.issues.some(
      (issue) => issue.path[0] === "confirmPassword",
    );
    return {
      message: passwordMismatch
        ? "The passwords do not match."
        : "Use at least 12 characters with uppercase, lowercase, a number and a symbol.",
      status: "error",
    };
  }

  const supabase = await createClient({ persistence: "session" });
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    if (claimsError) {
      logAuthDiagnostic(
        "password_reset_session_invalid",
        classifyAuthFailure(claimsError),
        claimsError,
      );
    }
    return {
      message: "This password reset session has expired. Request a new link.",
      status: "error",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    logAuthDiagnostic(
      "password_update_failed",
      classifyAuthFailure(error),
      error,
    );
    return {
      message: "The password could not be updated. Request a new reset link.",
      status: "error",
    };
  }

  await signOutAndClearSession(supabase);
  redirect("/staff/login?status=password-reset");
}

export async function signOutAction() {
  const supabase = await createClient();
  await signOutAndClearSession(supabase);
  redirect("/staff/login?status=signed-out");
}
