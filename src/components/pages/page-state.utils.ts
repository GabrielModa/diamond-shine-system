export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export function getStatusTone(status: string): BadgeTone {
  if (status === "ACTIVE" || status === "APPROVED" || status === "COMPLETED" || status === "READ") {
    return "success";
  }

  if (status === "PENDING" || status === "QUEUED") {
    return "warning";
  }

  if (status === "INACTIVE" || status === "REJECTED") {
    return "danger";
  }

  return "neutral";
}

export function getSupplyWorkflowState(status: string): string {
  if (status === "PENDING") {
    return "Awaiting supervisor review";
  }

  if (status === "APPROVED") {
    return "Approved, waiting completion";
  }

  if (status === "COMPLETED") {
    return "Request fulfilled";
  }

  if (status === "REJECTED") {
    return "Review rejected";
  }

  return "Unknown workflow state";
}

export async function readApiError(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (payload?.error) {
    return payload.error;
  }
  return fallback;
}
