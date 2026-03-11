import { sendFeedbackEmail } from "../../lib/email";
import type { Feedback, FeedbackCategory } from "../../types/feedback";
import type { UserRole } from "../../types/user";
import { createAuditService } from "../audit/audit.service";
import type { CreateFeedbackInput, ListFeedbackInput, UpdateFeedbackInput } from "./feedback.types";

type FeedbackRecord = {
  id: string;
  employeeId: string;
  reviewerId: string;
  score: number;
  averageScore: number;
  categoryLabel: FeedbackCategory;
  comments: string;
  date: Date;
};

type FeedbackServiceDeps = {
  auditLog: { create: (args: { data: { actorId: string; action: string; entity: string; entityId: string; metadata?: unknown } }) => Promise<unknown> };
  feedback: {
    create: (args: { data: { employeeId: string; reviewerId: string; score: number; averageScore: number; categoryLabel: FeedbackCategory; comments: string }; select: typeof feedbackSelect }) => Promise<FeedbackRecord>;
    findMany: (args: { where: { employeeId?: string; reviewerId?: string }; select: typeof feedbackSelect; orderBy: { date: "desc" } }) => Promise<FeedbackRecord[]>;
    update: (args: { where: { id: string }; data: { score: number; comments: string; categoryLabel: FeedbackCategory }; select: typeof feedbackSelect }) => Promise<FeedbackRecord>;
    aggregate: (args: { _avg: { score: true } }) => Promise<{ _avg: { score: number | null } }>;
  };
  activity?: { create: (args: { data: { actorId: string; action: string; entity: string; entityId: string; metadata?: unknown } }) => Promise<unknown> };
  notification?: { create: (args: { data: { recipientId: string; title: string; message: string; channel: "IN_APP"; status: "QUEUED" } }) => Promise<unknown> };
};

const feedbackSelect = { averageScore: true, categoryLabel: true, comments: true, date: true, employeeId: true, id: true, reviewerId: true, score: true } as const;

const toFeedback = (record: FeedbackRecord): Feedback => ({ ...record });

const getCategoryLabel = (score: number): FeedbackCategory => {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Very Good";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  return "Poor";
};

function assertCanCreateOrUpdate(actorRole: UserRole, action: "create" | "update"): void {
  if (actorRole !== "SUPERVISOR" && actorRole !== "ADMIN") throw new Error(`Only supervisors or admins can ${action} feedback.`);
}

function buildListWhere(input: ListFeedbackInput): { employeeId?: string; reviewerId?: string } {
  if (input.actorRole === "ADMIN") return {};
  if (input.actorRole === "EMPLOYEE") return { employeeId: input.employeeId };
  if (input.actorRole === "SUPERVISOR") return { reviewerId: input.reviewerId };
  throw new Error("Viewers cannot list feedback.");
}

export function createFeedbackService(deps: FeedbackServiceDeps) {
  const auditService = createAuditService({ auditLog: deps.auditLog });
  return {
    async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
      assertCanCreateOrUpdate(input.actorRole, "create");
      const categoryLabel = getCategoryLabel(input.score);
      const aggregate = await deps.feedback.aggregate({ _avg: { score: true } });
      const averageScore = Number((((aggregate._avg.score ?? input.score) + input.score) / 2).toFixed(2));

      const created = await deps.feedback.create({
        data: { averageScore, categoryLabel, comments: input.comments, employeeId: input.employeeId, reviewerId: input.reviewerId, score: input.score },
        select: feedbackSelect,
      });

      await Promise.all([
        auditService.createAuditLog({ action: "FEEDBACK_CREATED", actorId: input.actorId, entity: "Feedback", entityId: created.id, metadata: { categoryLabel, score: input.score } }),
        deps.activity?.create({ data: { action: "FEEDBACK_CREATED", actorId: input.actorId, entity: "Feedback", entityId: created.id } }),
        deps.notification?.create({ data: { channel: "IN_APP", message: `New feedback available (${categoryLabel}).`, recipientId: input.reviewerId, status: "QUEUED", title: "Feedback created" } }),
        sendFeedbackEmail({ categoryLabel, comments: input.comments, employeeId: input.employeeId, score: input.score }),
      ]);

      return toFeedback(created);
    },

    async listFeedback(input: ListFeedbackInput): Promise<Feedback[]> {
      return (await deps.feedback.findMany({ orderBy: { date: "desc" }, select: feedbackSelect, where: buildListWhere(input) })).map(toFeedback);
    },

    async updateFeedback(input: UpdateFeedbackInput): Promise<Feedback> {
      assertCanCreateOrUpdate(input.actorRole, "update");
      const updated = await deps.feedback.update({
        data: { categoryLabel: getCategoryLabel(input.score), comments: input.comments, score: input.score },
        select: feedbackSelect,
        where: { id: input.feedbackId },
      });
      await Promise.all([
        auditService.createAuditLog({ action: "FEEDBACK_UPDATED", actorId: input.actorId, entity: "Feedback", entityId: input.feedbackId, metadata: { score: input.score } }),
        deps.activity?.create({ data: { action: "FEEDBACK_UPDATED", actorId: input.actorId, entity: "Feedback", entityId: input.feedbackId } }),
      ]);
      return toFeedback(updated);
    },
  };
}

export function createFeedbackServiceFromPrisma(prisma: FeedbackServiceDeps) {
  return createFeedbackService(prisma);
}
