import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/dal";

export default async function StaffIndexPage() {
  const { profile } = await requireActiveUser();

  if (profile.role === "admin") redirect("/admin");
  redirect("/staff/jobs");
}
