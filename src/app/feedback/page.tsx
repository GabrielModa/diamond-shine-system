import { headers } from "next/headers";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { CreateFeedbackForm } from "@/src/components/forms/CreateFeedbackForm";

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

export default async function FeedbackPage() {
  const feedback = await getFeedbackRecords();

  return (
    <DashboardLayout currentPath="/feedback" title="Feedback">
      <CreateFeedbackForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Reviewer</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Comments</th>
              <th className="px-4 py-3 font-semibold">Date</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
