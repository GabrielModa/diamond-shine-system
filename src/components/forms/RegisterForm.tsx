"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFormShell } from "./AuthFormShell";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    confirmPassword: "",
    email: "",
    name: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      password: form.password,
    };

    if (!payload.name || !payload.email || !payload.password || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (payload.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/register", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Unable to create account.");
      setIsSubmitting(false);
      return;
    }

    router.push("/login?registered=1");
    router.refresh();
  }

  function updateField(field: "confirmPassword" | "email" | "name" | "password", value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <AuthFormShell
      title="Create account"
      subtitle="Register a local account with the default EMPLOYEE role."
      footer={
        <div className="text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="name@company.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="Minimum 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="Repeat your password"
          />
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthFormShell>
  );
}
