"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6">
      <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
      <p className="max-w-lg text-center text-sm text-slate-600">{error.message}</p>
      <button onClick={() => reset()} className="rounded bg-slate-900 px-4 py-2 text-sm text-white" type="button">Try again</button>
    </div>
  );
}
