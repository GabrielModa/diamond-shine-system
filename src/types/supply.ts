export type SupplyStatus = "PENDING" | "APPROVED" | "REJECTED" | "EMAIL_SENT" | "COMPLETED";
export type SupplyPriority = "LOW" | "NORMAL" | "URGENT";

export type Supply = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: SupplyStatus;
  priority: SupplyPriority;
  notes: string | null;
  emailSentAt: Date | null;
  requestDate: Date;
  requesterId: string;
};
