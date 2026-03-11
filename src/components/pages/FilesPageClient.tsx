"use client";

import { type FormEvent, useEffect, useState } from "react";
import { readApiError } from "./page-state.utils";

type Row = { id: string; filename: string; mimeType: string; sizeBytes: number; createdAt: string };

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayName(filename: string): string {
  return filename.replace(/^\d+-/, "");
}

export function FilesPageClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/files", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to load files."));
      }
      setRows((await response.json()) as Row[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load files.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please select a file before uploading.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/files", { method: "POST", body: formData });
    if (!response.ok) {
      setError(await readApiError(response, "Failed to upload file."));
      setUploading(false);
      return;
    }

    setSelectedFile(null);
    const input = document.getElementById("upload-file") as HTMLInputElement | null;
    if (input) input.value = "";

    await load();
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Upload file</h2>
        <input id="upload-file" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        <p className="text-xs text-slate-500">Files are stored in <code>/uploads</code>.</p>
        <button disabled={uploading} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{uploading ? "Uploading..." : "Upload file"}</button>
      </form>

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading files...</p> : null}
      {!loading && !rows.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No uploaded files yet.</p> : null}

      {!loading && rows.length ? (
        <ul className="space-y-2">
          {rows.map((file) => (
            <li key={file.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{displayName(file.filename)}</p>
              <p className="text-xs text-slate-600">{file.mimeType} · {humanSize(file.sizeBytes)}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{new Date(file.createdAt).toLocaleString()}</span>
                <a href={`/api/files?filename=${encodeURIComponent(file.filename)}`} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white">Download</a>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
