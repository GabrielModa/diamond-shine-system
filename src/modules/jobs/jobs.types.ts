import type { UserRole } from "../../types/user";

export type JobStatus = "SCHEDULED" | "RUNNING" | "COMPLETED" | "FAILED";

export type ScheduleJobInput = {
  actorId: string;
  actorRole: UserRole;
  key: string;
  payload?: Record<string, unknown>;
  runAt: Date;
};

export type UpdateJobStatusInput = {
  jobId: string;
  status: JobStatus;
};

export type Job = {
  id: string;
  key: string;
  payload: Record<string, unknown> | null;
  runAt: Date;
  status: JobStatus;
};
