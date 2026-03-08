import { NextRequest } from "next/server";

const {
  createFeedbackServiceFromPrismaMock,
  feedbackServiceMock,
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
    prismaMock: {
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

import { GET, PATCH, POST } from "../../src/app/api/feedback/route";

describe("Feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/feedback creates feedback", async () => {
    const payload = {
      actorRole: "SUPERVISOR",
      comments: "Consistent quality of work.",
      employeeId: "u1",
      reviewerId: "u2",
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
      feedback: prismaMock.feedback,
    });
    expect(feedbackServiceMock.createFeedback).toHaveBeenCalledWith(payload);
    expect(response.status).toBe(201);
  });

  it("GET /api/feedback lists employee feedback", async () => {
    feedbackServiceMock.listFeedback.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/feedback?actorRole=EMPLOYEE&employeeId=u1",
      {
        method: "GET",
      },
    );

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
      actorRole: "ADMIN",
      comments: "Updated review.",
      feedbackId: "f1",
      score: 8,
    };

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

    expect(feedbackServiceMock.updateFeedback).toHaveBeenCalledWith(payload);
    expect(response.status).toBe(200);
  });
});
