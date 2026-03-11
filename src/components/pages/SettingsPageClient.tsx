"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { readApiError } from "./page-state.utils";

type Row = { key: string; value: string; updatedBy: string; updatedAt?: string };

type SettingsDraft = {
  systemName: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  smtpFrom: string;
  defaultAdminEmail: string;
  notifySupply: boolean;
  notifyFeedback: boolean;
  notifyFiles: boolean;
};

const DEFAULTS: SettingsDraft = {
  defaultAdminEmail: "",
  notifyFeedback: true,
  notifyFiles: true,
  notifySupply: true,
  smtpFrom: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
  smtpSecure: false,
  systemName: "Diamond Shine",
};

const TOGGLE_KEYS: Array<{ key: keyof SettingsDraft; label: string }> = [
  { key: "notifySupply", label: "Supply workflow notifications" },
  { key: "notifyFeedback", label: "Feedback notifications" },
  { key: "notifyFiles", label: "File upload notifications" },
];

export function SettingsPageClient({ role }: { role: "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<SettingsDraft>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canManage = role === "ADMIN";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load settings."));
      const data = (await response.json()) as Row[];
      setRows(data);
      const map = new Map(data.map((row) => [row.key, row.value]));
      setForm({
        defaultAdminEmail: map.get("defaultAdminEmail") ?? DEFAULTS.defaultAdminEmail,
        notifyFeedback: (map.get("notifyFeedback") ?? String(DEFAULTS.notifyFeedback)) === "true",
        notifyFiles: (map.get("notifyFiles") ?? String(DEFAULTS.notifyFiles)) === "true",
        notifySupply: (map.get("notifySupply") ?? String(DEFAULTS.notifySupply)) === "true",
        smtpFrom: map.get("smtpFrom") ?? DEFAULTS.smtpFrom,
        smtpHost: map.get("smtpHost") ?? DEFAULTS.smtpHost,
        smtpPass: map.get("smtpPass") ?? DEFAULTS.smtpPass,
        smtpPort: map.get("smtpPort") ?? DEFAULTS.smtpPort,
        smtpSecure: (map.get("smtpSecure") ?? String(DEFAULTS.smtpSecure)) === "true",
        smtpUser: map.get("smtpUser") ?? DEFAULTS.smtpUser,
        systemName: map.get("systemName") ?? DEFAULTS.systemName,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load settings.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const lastUpdated = useMemo(() => rows[0]?.updatedAt, [rows]);

  const saveKeyValue = async (key: string, value: string) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, `Failed to save setting ${key}.`));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await Promise.all([
        saveKeyValue("systemName", form.systemName),
        saveKeyValue("smtpHost", form.smtpHost),
        saveKeyValue("smtpPort", form.smtpPort),
        saveKeyValue("smtpUser", form.smtpUser),
        saveKeyValue("smtpPass", form.smtpPass),
        saveKeyValue("smtpSecure", String(form.smtpSecure)),
        saveKeyValue("smtpFrom", form.smtpFrom),
        saveKeyValue("defaultAdminEmail", form.defaultAdminEmail),
        saveKeyValue("notifySupply", String(form.notifySupply)),
        saveKeyValue("notifyFeedback", String(form.notifyFeedback)),
        saveKeyValue("notifyFiles", String(form.notifyFiles)),
      ]);
      setMessage("Settings saved successfully.");
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading settings...</p>;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Platform settings</h2>
        <p className="mt-1 text-xs text-slate-500">Configure branding, SMTP transport and notification preferences. {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : "No updates yet."}</p>
      </section>

      {message ? <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="System name"><input value={form.systemName} onChange={(event) => setForm((current) => ({ ...current, systemName: event.target.value }))} className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
          <Field label="Default admin email"><input value={form.defaultAdminEmail} onChange={(event) => setForm((current) => ({ ...current, defaultAdminEmail: event.target.value }))} type="email" className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
          <Field label="SMTP host"><input value={form.smtpHost} onChange={(event) => setForm((current) => ({ ...current, smtpHost: event.target.value }))} className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
          <Field label="SMTP port"><input value={form.smtpPort} onChange={(event) => setForm((current) => ({ ...current, smtpPort: event.target.value }))} className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
          <Field label="SMTP user"><input value={form.smtpUser} onChange={(event) => setForm((current) => ({ ...current, smtpUser: event.target.value }))} className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
          <Field label="SMTP password"><input value={form.smtpPass} onChange={(event) => setForm((current) => ({ ...current, smtpPass: event.target.value }))} type="password" className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
          <label className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm text-slate-700 md:col-span-2"><input type="checkbox" checked={form.smtpSecure} onChange={(event) => setForm((current) => ({ ...current, smtpSecure: event.target.checked }))} disabled={!canManage} /> SMTP secure (TLS)</label>
          <Field label="SMTP from"><input value={form.smtpFrom} onChange={(event) => setForm((current) => ({ ...current, smtpFrom: event.target.value }))} className="rounded border px-3 py-2 text-sm" disabled={!canManage} /></Field>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notification preferences</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {TOGGLE_KEYS.map((entry) => (
              <label key={entry.key} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm text-slate-700">
                <input type="checkbox" checked={form[entry.key] as boolean} onChange={(event) => setForm((current) => ({ ...current, [entry.key]: event.target.checked }))} disabled={!canManage} />
                {entry.label}
              </label>
            ))}
          </div>
        </div>

        <button disabled={!canManage || saving} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "Saving..." : canManage ? "Save settings" : "Admin access required"}</button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
