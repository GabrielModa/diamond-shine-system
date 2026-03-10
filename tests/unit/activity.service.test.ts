import { createActivityService } from "../../src/modules/activity/activity.service";

describe("Activity service", () => {
  function createDeps() {
    return {
      activity: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
  }

  it("lists all feed items for admins", async () => {
    const deps = createDeps();
    const service = createActivityService(deps as never);

    deps.activity.findMany.mockResolvedValue([]);

    await service.listFeed({
      actorId: "u-admin",
      actorRole: "ADMIN",
    });

    expect(deps.activity.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      where: undefined,
    });
  });

  it("scopes feed for non-admin users", async () => {
    const deps = createDeps();
    const service = createActivityService(deps as never);

    deps.activity.findMany.mockResolvedValue([]);

    await service.listFeed({
      actorId: "u-1",
      actorRole: "EMPLOYEE",
    });

    expect(deps.activity.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      where: {
        actorId: "u-1",
      },
    });
  });
});
