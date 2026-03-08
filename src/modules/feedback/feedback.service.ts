import type { Feedback } from "../../types/feedback";
import type { UserRole } from "../../types/user";
import { createAuditService } from "../audit/audit.service";
import type {
  CreateFeedbackInput,
  ListFeedbackInput,
  UpdateFeedbackInput,
} from "./feedback.types";

type FeedbackRecord = {
  id: string;
  employeeId: string;
  reviewerId: string;
  score: number;
  comments: string;
  date: Date;
};

type FeedbackDelegate = {
  create: (args: {
    data: {
      employeeId: string;
      reviewerId: string;
      score: number;
      comments: string;
    };
    select: {
      id: true;
      employeeId: true;
      reviewerId: true;
      score: true;
      comments: true;
      date: true;
    };
  }) => Promise<FeedbackRecord>;
  findMany: (args: {
    where: {
      employeeId?: string;
      reviewerId?: string;
    };
    select: {
      id: true;
      employeeId: true;
      reviewerId: true;
      score: true;
      comments: true;
      date: true;
    };
    orderBy: {
      date: "desc";
    };
  }) => Promise<FeedbackRecord[]>;
  update: (args: {
    where: {
      id: string;
    };
    data: {
      score: number;
      comments: string;
    };
    select: {
      id: true;
      employeeId: true;
      reviewerId: true;
      score: true;
      comments: true;
      date: true;
    };
  }) => Promise<FeedbackRecord>;
};

type FeedbackServiceDeps = {
  auditLog: {
    create: (args: {
      data: {
        actorId: string;
        action: string;
        entity: string;
        entityId: string;
        metadata?: Record<string, unknown>;
      };
    }) => Promise<unknown>;
  };
  feedback: FeedbackDelegate;
};

const feedbackSelect = {
  comments: true,
  date: true,
  employeeId: true,
  id: true,
  reviewerId: true,
  score: true,
} as const;

function toFeedback(record: FeedbackRecord): Feedback {
  return {
    comments: record.comments,
    date: record.date,
    employeeId: record.employeeId,
    id: record.id,
    reviewerId: record.reviewerId,
    score: record.score,
  };
}

function assertCanCreateOrUpdate(actorRole: UserRole, action: "create" | "update"): void {
  if (actorRole !== "SUPERVISOR" && actorRole !== "ADMIN") {
    throw new Error(`Only supervisors or admins can ${action} feedback.`);
  }
}

function buildListWhere(input: ListFeedbackInput): {
  employeeId?: string;
  reviewerId?: string;
} {
  if (input.actorRole === "ADMIN") {
    return {};
  }

  if (input.actorRole === "EMPLOYEE") {
    if (!input.employeeId) {
      throw new Error("Employees must provide an employee id.");
    }
    return {
      employeeId: input.employeeId,
    };
  }

  if (input.actorRole === "SUPERVISOR") {
    if (!input.reviewerId) {
      throw new Error("Supervisors must provide a reviewer id.");
    }
    return {
      reviewerId: input.reviewerId,
    };
  }

  throw new Error("Viewers cannot list feedback.");
}

export function createFeedbackService(
  deps: FeedbackServiceDeps,
) {
  const auditService = createAuditService({
    auditLog: deps.auditLog,
  });

  return {
    async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
      assertCanCreateOrUpdate(input.actorRole, "create");

      const created = await deps.feedback.create({
        data: {
          comments: input.comments,
          employeeId: input.employeeId,
          reviewerId: input.reviewerId,
          score: input.score,
        },
        select: feedbackSelect,
      });

      await auditService.createAuditLog({
        action: "FEEDBACK_CREATED",
        actorId: input.actorId,
        entity: "Feedback",
        entityId: created.id,
        metadata: {
          employeeId: input.employeeId,
          score: input.score,
        },
      });

      return toFeedback(created);
    },

    async listFeedback(input: ListFeedbackInput): Promise<Feedback[]> {
      const records = await deps.feedback.findMany({
        orderBy: {
          date: "desc",
        },
        select: feedbackSelect,
        where: buildListWhere(input),
      });

      return records.map(toFeedback);
    },

    async updateFeedback(input: UpdateFeedbackInput): Promise<Feedback> {
      assertCanCreateOrUpdate(input.actorRole, "update");

      const updated = await deps.feedback.update({
        data: {
          comments: input.comments,
          score: input.score,
        },
        select: feedbackSelect,
        where: {
          id: input.feedbackId,
        },
      });

      await auditService.createAuditLog({
        action: "FEEDBACK_UPDATED",
        actorId: input.actorId,
        entity: "Feedback",
        entityId: input.feedbackId,
        metadata: {
          score: input.score,
        },
      });

      return toFeedback(updated);
    },
  };
}

export function createFeedbackServiceFromPrisma(prisma: FeedbackServiceDeps) {
  return createFeedbackService(prisma);
}
