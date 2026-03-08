import Link from "next/link";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";

const CARDS = [
  {
    href: "/users",
    description: "Manage roles and status for platform users.",
    title: "Users",
  },
  {
    href: "/supplies",
    description: "Review supply requests and approvals.",
    title: "Supplies",
  },
  {
    href: "/feedback",
    description: "Track and review employee feedback records.",
    title: "Feedback",
  },
];

export default async function DashboardPage() {
  return (
    <DashboardLayout currentPath="/dashboard" title="Dashboard">
      <section className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </DashboardLayout>
  );
}
