import type { UserRole } from "../../types/user";

export type CreateFeedbackInput = {
  actorId: string;
  actorRole: UserRole;
  employeeId: string;
  reviewerId: string;
  score: number;
  comments: string;
};

export type ListFeedbackInput = {
  actorRole: UserRole;
  employeeId?: string;
  reviewerId?: string;
};

export type UpdateFeedbackInput = {
  actorId: string;
  actorRole: UserRole;
  feedbackId: string;
  score: number;
  comments: string;
};
