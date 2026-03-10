import type { UserRole } from "../../types/user";

export type ReportFormat = "CSV" | "JSON" | "PDF";

export type GenerateReportInput = {
  actorId: string;
  actorRole: UserRole;
  reportKey: string;
  format: ReportFormat;
  filters?: Record<string, string | number | boolean>;
};

export type Report = {
  id: string;
  reportKey: string;
  format: ReportFormat;
  requestedBy: string;
  status: "PENDING" | "GENERATED";
  createdAt: Date;
};
