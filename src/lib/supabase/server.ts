import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "./config";
import {
  applySessionLifetime,
  REMEMBER_ME_COOKIE,
  REMEMBERED_SESSION_SECONDS,
} from "./session-cookies";

export type SessionPersistence = "persistent" | "session";

export async function createClient(options?: {
  persistence?: SessionPersistence;
}) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseConfig();
  const persistent =
    options?.persistence !== undefined
      ? options.persistence === "persistent"
      : cookieStore.get(REMEMBER_ME_COOKIE)?.value === "1";

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(
              name,
              value,
              applySessionLifetime(cookieOptions, value, persistent),
            );
          });
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes them.
        }
      },
    },
  });
}

export async function setSessionPersistence(
  persistence: SessionPersistence,
) {
  const cookieStore = await cookies();
  const persistent = persistence === "persistent";

  cookieStore.set(REMEMBER_ME_COOKIE, persistent ? "1" : "0", {
    httpOnly: true,
    maxAge: persistent ? REMEMBERED_SESSION_SECONDS : undefined,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionPersistence() {
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_ME_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
