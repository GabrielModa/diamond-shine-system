import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SettingsPageClient } from "@/src/components/pages/SettingsPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function SettingsPage() {
  const { role } = await requireAuthenticatedRoute("/settings");

  return (
    <DashboardLayout currentPath="/settings" role={role} title="Settings">
      <SettingsPageClient role={role} />
    </DashboardLayout>
  );
}
