"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFormShell } from "./AuthFormShell";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/password-reset", {
      body: JSON.stringify({
        email: normalizedEmail,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "Unable to process password reset.");
      setIsSubmitting(false);
      return;
    }

    setMessage(
      result?.message ?? "If the account exists, a password reset link has been generated.",
    );
    setIsSubmitting(false);
  }

  return (
    <AuthFormShell
      title="Forgot password"
      subtitle="Enter your email and we will generate a reset link."
      footer={
        <div className="text-center">
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Back to sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="name@company.com"
          />
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Generating link..." : "Send reset link"}
        </button>
      </form>
    </AuthFormShell>
  );
}
