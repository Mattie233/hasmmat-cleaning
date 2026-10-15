import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_ME_COOKIE = "hasmmat-remember-session";
export const REMEMBERED_SESSION_SECONDS = 60 * 60 * 24 * 30;

export function applySessionLifetime(
  options: CookieOptions,
  value: string,
  persistent: boolean,
): CookieOptions {
  const nextOptions = { ...options };
  const isRemoval = value === "" || options.maxAge === 0;

  nextOptions.path = nextOptions.path ?? "/";
  nextOptions.sameSite = nextOptions.sameSite ?? "lax";
  nextOptions.secure = process.env.NODE_ENV === "production";
  nextOptions.httpOnly = true;

  if (isRemoval) {
    nextOptions.maxAge = 0;
    return nextOptions;
  }

  if (persistent) {
    nextOptions.maxAge = REMEMBERED_SESSION_SECONDS;
    delete nextOptions.expires;
  } else {
    delete nextOptions.maxAge;
    delete nextOptions.expires;
  }

  return nextOptions;
}
