import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SuppliesPageClient } from "@/src/components/pages/SuppliesPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function SuppliesPage() {
  const { role } = await requireAuthenticatedRoute("/supplies");

  return (
    <DashboardLayout currentPath="/supplies" role={role} title="Supplies">
      <SuppliesPageClient role={role} />
    </DashboardLayout>
  );
}
