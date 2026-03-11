import { z } from "zod";

export const queueNotificationSchema = z.object({
  channel: z.enum(["IN_APP", "EMAIL"]),
  message: z.string().min(1),
  recipientId: z.string().min(1),
  title: z.string().min(1),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1),
});

export const scheduleJobSchema = z.object({
  key: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  runAt: z.string().datetime(),
});

export const updateJobStatusSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["SCHEDULED", "RUNNING", "COMPLETED", "FAILED"]),
});

export const generateReportSchema = z.object({
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  format: z.enum(["CSV", "JSON", "PDF"]),
  reportKey: z.string().min(1),
});

export const upsertSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});


export const recordActivitySchema = z.object({
  action: z.string().min(1),
  entity: z.string().min(1),
  entityId: z.string().min(1),
  metadata: z.unknown().optional(),
});

export const registerFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export const createWorkflowInstanceSchema = z.object({
  definition: z.object({
    name: z.string().min(1),
    steps: z.array(z.string().min(1)).min(1),
    version: z.number().int().positive(),
  }),
  entityId: z.string().min(1),
});

export const transitionWorkflowSchema = z.object({
  instanceId: z.string().min(1),
  nextStep: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
});
