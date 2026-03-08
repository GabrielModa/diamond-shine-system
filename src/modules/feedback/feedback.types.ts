import type { UserRole } from "../../types/user";

export type CreateFeedbackInput = {
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
  actorRole: UserRole;
  feedbackId: string;
  score: number;
  comments: string;
};
