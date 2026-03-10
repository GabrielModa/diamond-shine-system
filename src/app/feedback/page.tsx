import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SubmitButton } from "@/src/components/dashboard/SubmitButton";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

type FeedbackRow = {
  id: string;
  employeeId: string;
  reviewerId: string;
  score: number;
  comments: string;
  date: string;
};

async function getFeedbackRecords(): Promise<FeedbackRow[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const response = await fetch(`${protocol}://${host}/api/feedback`, {
    cache: "no-store",
    headers: {
      cookie: requestHeaders.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load feedback.");
  }

  return (await response.json()) as FeedbackRow[];
}

async function callFeedbackApi(path: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
  "use server";

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const response = await fetch(`${protocol}://${host}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      cookie: requestHeaders.get("cookie") ?? "",
    },
    method,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to process feedback action.");
  }
}

async function createFeedbackAction(formData: FormData) {
  "use server";

  const employeeId = String(formData.get("employeeId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const comments = String(formData.get("comments") ?? "");

  await callFeedbackApi("/api/feedback", "POST", {
    comments,
    employeeId,
    score,
  });
  revalidatePath("/feedback");
}

async function updateFeedbackAction(formData: FormData) {
  "use server";

  const feedbackId = String(formData.get("feedbackId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const comments = String(formData.get("comments") ?? "");

  await callFeedbackApi("/api/feedback", "PATCH", {
    comments,
    feedbackId,
    score,
  });
  revalidatePath("/feedback");
}

export default async function FeedbackPage() {
  const { role } = await requireAuthenticatedRoute("/feedback");
  const canCreateOrUpdate = role === "ADMIN" || role === "SUPERVISOR";
  const feedback = await getFeedbackRecords();

  return (
    <DashboardLayout currentPath="/feedback" role={role} title="Feedback">
      {canCreateOrUpdate ? (
        <form
          action={createFeedbackAction}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Create Feedback</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              name="employeeId"
              type="text"
              required
              placeholder="Employee ID"
              className="rounded border px-3 py-2 text-sm text-slate-900"
            />
            <input
              name="score"
              type="number"
              min={1}
              max={10}
              required
              defaultValue={5}
              className="rounded border px-3 py-2 text-sm text-slate-900"
            />
            <input
              name="comments"
              type="text"
              required
              placeholder="Comments"
              className="rounded border px-3 py-2 text-sm text-slate-900"
            />
            <SubmitButton idleLabel="Create Feedback" pendingLabel="Submitting..." />
          </div>
        </form>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Reviewer</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Comments</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{item.employeeId}</td>
                <td className="px-4 py-3 text-slate-600">{item.reviewerId}</td>
                <td className="px-4 py-3 text-slate-600">{item.score}</td>
                <td className="px-4 py-3 text-slate-600">{item.comments}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {canCreateOrUpdate ? (
                    <form action={updateFeedbackAction} className="flex items-center gap-2">
                      <input type="hidden" name="feedbackId" value={item.id} />
                      <input
                        name="score"
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={item.score}
                        className="w-20 rounded border px-3 py-2 text-sm text-slate-900"
                      />
                      <input
                        name="comments"
                        type="text"
                        defaultValue={item.comments}
                        className="w-56 rounded border px-3 py-2 text-sm text-slate-900"
                      />
                      <SubmitButton idleLabel="Update" pendingLabel="Saving..." />
                    </form>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
