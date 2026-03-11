type MetricsCardsProps = {
  pendingSupplies: number;
  emailSentSupplies: number;
  completedSupplies: number;
  averageFeedbackScore: number;
};

const CARD_CONFIG = [
  { key: "pendingSupplies", label: "Pending Supplies" },
  { key: "emailSentSupplies", label: "Email Sent Supplies" },
  { key: "completedSupplies", label: "Completed Supplies" },
  { key: "averageFeedbackScore", label: "Feedback Score" },
] as const;

export function MetricsCards(props: MetricsCardsProps) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {CARD_CONFIG.map((card) => (
        <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{props[card.key]}</p>
        </article>
      ))}
    </section>
  );
}
