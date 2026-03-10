import { createNotificationsService } from "../../src/modules/notifications/notifications.service";

describe("Notifications service", () => {
  function createDeps() {
    return {
      notification: {
        create: vi.fn(),
        update: vi.fn(),
      },
    };
  }

  it("queues notification for employee actor", async () => {
    const deps = createDeps();
    const service = createNotificationsService(deps as never);

    deps.notification.create.mockResolvedValue({
      id: "n-1",
      recipientId: "u-2",
      title: "Request approved",
      message: "Your supply request was approved.",
      channel: "IN_APP",
      status: "QUEUED",
      createdAt: new Date(),
    });

    const result = await service.queueNotification({
      actorId: "u-1",
      actorRole: "EMPLOYEE",
      recipientId: "u-2",
      title: "Request approved",
      message: "Your supply request was approved.",
      channel: "IN_APP",
    });

    expect(result.status).toBe("QUEUED");
  });

  it("blocks viewer from queuing notifications", async () => {
    const service = createNotificationsService(createDeps() as never);

    await expect(
      service.queueNotification({
        actorId: "u-viewer",
        actorRole: "VIEWER",
        recipientId: "u-2",
        title: "x",
        message: "x",
        channel: "IN_APP",
      }),
    ).rejects.toThrow("Viewers cannot queue notifications.");
  });
});
