import { z } from "zod";

export const createFeedbackSchema = z.object({
  comments: z.string().min(1),
  employeeId: z.string().min(1),
  score: z.number().min(1).max(10),
});

export const updateFeedbackSchema = z.object({
  comments: z.string().min(1),
  feedbackId: z.string().min(1),
  score: z.number().min(1).max(10),
});
