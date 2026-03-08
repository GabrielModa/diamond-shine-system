import { createFeedbackService } from "../../src/modules/feedback/feedback.service";
import type {
  CreateFeedbackInput,
  ListFeedbackInput,
  UpdateFeedbackInput,
} from "../../src/modules/feedback/feedback.types";

function createPrismaMock() {
  return {
    auditLog: {
      create: vi.fn(),
    },
    feedback: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("Feedback service", () => {
  it("creates feedback as supervisor", async () => {
    const prisma = createPrismaMock();
    const service = createFeedbackService(prisma as never);

    const input: CreateFeedbackInput = {
      actorId: "u-supervisor",
      actorRole: "SUPERVISOR",
      comments: "Strong performance this sprint.",
      employeeId: "u-employee",
      reviewerId: "u-supervisor",
      score: 9,
    };

    prisma.feedback.create.mockResolvedValue({
      comments: input.comments,
      date: new Date("2026-03-08T00:00:00.000Z"),
      employeeId: input.employeeId,
      id: "f1",
      reviewerId: input.reviewerId,
      score: input.score,
    });

    const result = await service.createFeedback(input);

    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        comments: input.comments,
        employeeId: input.employeeId,
        reviewerId: input.reviewerId,
        score: input.score,
      },
      select: {
        comments: true,
        date: true,
        employeeId: true,
        id: true,
        reviewerId: true,
        score: true,
      },
    });
    expect(result.score).toBe(9);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "FEEDBACK_CREATED",
        actorId: input.actorId,
        entity: "Feedback",
        entityId: "f1",
        metadata: {
          employeeId: input.employeeId,
          score: input.score,
        },
      },
    });
  });

  it("blocks feedback creation for employees", async () => {
    const prisma = createPrismaMock();
    const service = createFeedbackService(prisma as never);

    const input: CreateFeedbackInput = {
      actorId: "u-employee",
      actorRole: "EMPLOYEE",
      comments: "Strong performance this sprint.",
      employeeId: "u-employee",
      reviewerId: "u-supervisor",
      score: 9,
    };

    await expect(service.createFeedback(input)).rejects.toThrow(
      "Only supervisors or admins can create feedback.",
    );
    expect(prisma.feedback.create).not.toHaveBeenCalled();
  });

  it("lists only own feedback for employees", async () => {
    const prisma = createPrismaMock();
    const service = createFeedbackService(prisma as never);

    const input: ListFeedbackInput = {
      actorRole: "EMPLOYEE",
      employeeId: "u-employee",
    };

    prisma.feedback.findMany.mockResolvedValue([]);

    await service.listFeedback(input);

    expect(prisma.feedback.findMany).toHaveBeenCalledWith({
      orderBy: {
        date: "desc",
      },
      select: {
        comments: true,
        date: true,
        employeeId: true,
        id: true,
        reviewerId: true,
        score: true,
      },
      where: {
        employeeId: input.employeeId,
      },
    });
  });

  it("lists all feedback for admins", async () => {
    const prisma = createPrismaMock();
    const service = createFeedbackService(prisma as never);

    const input: ListFeedbackInput = {
      actorRole: "ADMIN",
    };

    prisma.feedback.findMany.mockResolvedValue([]);

    await service.listFeedback(input);

    expect(prisma.feedback.findMany).toHaveBeenCalledWith({
      orderBy: {
        date: "desc",
      },
      select: {
        comments: true,
        date: true,
        employeeId: true,
        id: true,
        reviewerId: true,
        score: true,
      },
      where: {},
    });
  });

  it("updates feedback as admin", async () => {
    const prisma = createPrismaMock();
    const service = createFeedbackService(prisma as never);

    const input: UpdateFeedbackInput = {
      actorId: "u-admin",
      actorRole: "ADMIN",
      comments: "Updated comments.",
      feedbackId: "f1",
      score: 8,
    };

    prisma.feedback.update.mockResolvedValue({
      comments: input.comments,
      date: new Date("2026-03-08T00:00:00.000Z"),
      employeeId: "u-employee",
      id: input.feedbackId,
      reviewerId: "u-supervisor",
      score: input.score,
    });

    const result = await service.updateFeedback(input);

    expect(prisma.feedback.update).toHaveBeenCalledWith({
      data: {
        comments: input.comments,
        score: input.score,
      },
      select: {
        comments: true,
        date: true,
        employeeId: true,
        id: true,
        reviewerId: true,
        score: true,
      },
      where: {
        id: input.feedbackId,
      },
    });
    expect(result.comments).toBe("Updated comments.");
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "FEEDBACK_UPDATED",
        actorId: input.actorId,
        entity: "Feedback",
        entityId: input.feedbackId,
        metadata: {
          score: input.score,
        },
      },
    });
  });

  it("blocks feedback update for viewers", async () => {
    const prisma = createPrismaMock();
    const service = createFeedbackService(prisma as never);

    const input: UpdateFeedbackInput = {
      actorId: "u-viewer",
      actorRole: "VIEWER",
      comments: "Updated comments.",
      feedbackId: "f1",
      score: 8,
    };

    await expect(service.updateFeedback(input)).rejects.toThrow(
      "Only supervisors or admins can update feedback.",
    );
    expect(prisma.feedback.update).not.toHaveBeenCalled();
  });
});
