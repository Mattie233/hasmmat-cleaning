import "server-only";

import { SupabaseConfigurationError } from "@/lib/supabase/config";

const safeAuthErrorCodes = new Set([
  "bad_code_verifier",
  "bad_jwt",
  "email_not_confirmed",
  "invalid_credentials",
  "invalid_api_key",
  "otp_expired",
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "session_expired",
  "user_not_found",
]);

function getSafeErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) return {};

  const details: Record<string, string | number> = {};
  const name = "name" in error ? error.name : undefined;
  const code = "code" in error ? error.code : undefined;
  const status = "status" in error ? error.status : undefined;

  if (typeof name === "string" && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(name)) {
    details.name = name;
  }
  if (
    typeof code === "string" &&
    (safeAuthErrorCodes.has(code) ||
      /^[0-9A-Z]{5}$/.test(code) ||
      /^PGRST[0-9]{3}$/.test(code))
  ) {
    details.code = code;
  }
  if (typeof status === "number" && Number.isInteger(status)) {
    details.status = status;
  }

  return details;
}

export function logAuthDiagnostic(
  event: string,
  category: string,
  error?: unknown,
) {
  const details = error ? getSafeErrorDetails(error) : {};
  const logger =
    category === "invalid_credentials" ? console.warn : console.error;

  logger(`[auth] ${event}`, { category, ...details });
}

export function classifyAuthFailure(error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    return "invalid_supabase_configuration";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    /invalid (supabase )?(api )?key|invalid project url/i.test(error.message)
  ) {
    return "invalid_supabase_configuration";
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "invalid_credentials") return "invalid_credentials";
    if (error.code === "email_not_confirmed") return "email_not_confirmed";
  }

  if (
    error instanceof Error &&
    error.name === "AuthRetryableFetchError"
  ) {
    return "authentication_service_unavailable";
  }

  return "authentication_service_error";
}
