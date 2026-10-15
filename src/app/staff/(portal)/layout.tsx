import type { ReactNode } from "react";
import PortalHeader from "@/components/auth/PortalHeader";
import { requireCleaner } from "@/lib/auth/dal";

export default async function StaffPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireCleaner();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PortalHeader areaLabel="Cleaner Portal" userName={profile.full_name} />
      {children}
    </div>
  );
}
