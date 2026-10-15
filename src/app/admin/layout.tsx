import type { ReactNode } from "react";
import PortalHeader from "@/components/auth/PortalHeader";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <PortalHeader areaLabel="Administration" userName={profile.full_name} />
      {children}
    </div>
  );
}
