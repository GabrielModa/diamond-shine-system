"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  className?: string;
  idleLabel: string;
  pendingLabel?: string;
};

export function SubmitButton({ className, idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"}
    >
      {pending ? pendingLabel ?? "Saving..." : idleLabel}
    </button>
  );
}
