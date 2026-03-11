import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { FeedbackPageClient } from "@/src/components/pages/FeedbackPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function FeedbackPage() {
  const { role, session } = await requireAuthenticatedRoute("/feedback");

  return (
    <DashboardLayout currentPath="/feedback" role={role} title="Feedback">
      <FeedbackPageClient role={role} currentUserId={session.user.id} />
    </DashboardLayout>
  );
}
