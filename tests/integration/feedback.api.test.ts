import { NextRequest } from "next/server";

const {
  createFeedbackServiceFromPrismaMock,
  feedbackServiceMock,
  getServerSessionMock,
  prismaMock,
} = vi.hoisted(() => {
  const feedbackService = {
    createFeedback: vi.fn(),
    listFeedback: vi.fn(),
    updateFeedback: vi.fn(),
  };

  return {
    createFeedbackServiceFromPrismaMock: vi.fn(() => feedbackService),
    feedbackServiceMock: feedbackService,
    getServerSessionMock: vi.fn(),
    prismaMock: {
      auditLog: {},
      feedback: {},
    },
  };
});

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/modules/feedback/feedback.service", () => ({
  createFeedbackServiceFromPrisma: createFeedbackServiceFromPrismaMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import { GET, PATCH, POST } from "../../src/app/api/feedback/route";

describe("Feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        email: "supervisor@example.com",
        id: "u2",
        role: "SUPERVISOR",
      },
    });
  });

  it("POST /api/feedback creates feedback", async () => {
    const payload = {
      comments: "Consistent quality of work.",
      employeeId: "u1",
      score: 9,
    };

    feedbackServiceMock.createFeedback.mockResolvedValue({
      comments: payload.comments,
      date: new Date("2026-03-08T00:00:00.000Z"),
      employeeId: payload.employeeId,
      id: "f1",
      reviewerId: payload.reviewerId,
      score: payload.score,
    });

    const request = new NextRequest("http://localhost/api/feedback", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);

    expect(createFeedbackServiceFromPrismaMock).toHaveBeenCalledWith({
      auditLog: prismaMock.auditLog,
      feedback: prismaMock.feedback,
    });
    expect(feedbackServiceMock.createFeedback).toHaveBeenCalledWith({
      actorId: "u2",
      actorRole: "SUPERVISOR",
      comments: payload.comments,
      employeeId: payload.employeeId,
      reviewerId: "u2",
      score: payload.score,
    });
    expect(response.status).toBe(201);
  });

  it("GET /api/feedback lists employee feedback", async () => {
    feedbackServiceMock.listFeedback.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/feedback?employeeId=another-user",
      {
        method: "GET",
      },
    );

    getServerSessionMock.mockResolvedValue({
      user: {
        email: "employee@example.com",
        id: "u1",
        role: "EMPLOYEE",
      },
    });

    const response = await GET(request);

    expect(feedbackServiceMock.listFeedback).toHaveBeenCalledWith({
      actorRole: "EMPLOYEE",
      employeeId: "u1",
      reviewerId: undefined,
    });
    expect(response.status).toBe(200);
  });

  it("PATCH /api/feedback updates feedback", async () => {
    const payload = {
      comments: "Updated review.",
      feedbackId: "f1",
      score: 8,
    };

    getServerSessionMock.mockResolvedValue({
      user: {
        email: "admin@example.com",
        id: "u-admin",
        role: "ADMIN",
      },
    });

    feedbackServiceMock.updateFeedback.mockResolvedValue({
      comments: payload.comments,
      date: new Date("2026-03-08T00:00:00.000Z"),
      employeeId: "u1",
      id: payload.feedbackId,
      reviewerId: "u2",
      score: payload.score,
    });

    const request = new NextRequest("http://localhost/api/feedback", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });

    const response = await PATCH(request);

    expect(feedbackServiceMock.updateFeedback).toHaveBeenCalledWith({
      actorId: "u-admin",
      actorRole: "ADMIN",
      comments: payload.comments,
      feedbackId: payload.feedbackId,
      score: payload.score,
    });
    expect(response.status).toBe(200);
  });

  it("returns 401 when session does not exist", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/feedback", {
        method: "GET",
      }),
    );

    expect(feedbackServiceMock.listFeedback).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});
