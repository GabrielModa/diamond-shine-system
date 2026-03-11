import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SearchPageClient } from "@/src/components/pages/SearchPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function SearchPage() {
  const { role } = await requireAuthenticatedRoute("/search");

  return (
    <DashboardLayout currentPath="/search" role={role} title="Global Search">
      <SearchPageClient />
    </DashboardLayout>
  );
}
