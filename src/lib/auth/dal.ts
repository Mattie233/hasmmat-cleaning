import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type AuthContext } from "./types";

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsedProfile = profileSchema.safeParse(data);
  if (!parsedProfile.success) {
    return null;
  }

  return { profile: parsedProfile.data, userId };
});

export async function requireUser() {
  const context = await getAuthContext();
  if (!context) redirect("/staff/login?error=authentication-required");
  return context;
}

export async function requireActiveUser() {
  const context = await requireUser();
  if (context.profile.status !== "active") {
    redirect("/staff/login?error=account-unavailable");
  }
  return context;
}

export async function requireAdmin() {
  const context = await requireActiveUser();
  if (context.profile.role !== "admin") {
    redirect("/staff/jobs?notice=admin-access-denied");
  }
  return context;
}

export async function requireCleaner() {
  const context = await requireActiveUser();
  if (context.profile.role !== "cleaner") {
    redirect("/admin?notice=staff-access-denied");
  }
  return context;
}
