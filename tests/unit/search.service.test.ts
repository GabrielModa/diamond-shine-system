import { createSearchService } from "../../src/modules/search/search.service";

describe("Search service", () => {
  function createDeps() {
    return {
      user: {
        findMany: vi.fn(),
      },
      supplyRequest: {
        findMany: vi.fn(),
      },
      feedback: {
        findMany: vi.fn(),
      },
    };
  }

  it("aggregates cross-module search results", async () => {
    const deps = createDeps();
    const service = createSearchService(deps as never);

    deps.user.findMany.mockResolvedValue([{ id: "u1", email: "john@example.com", name: "John" }]);
    deps.supplyRequest.findMany.mockResolvedValue([{ id: "s1", item: "Gloves" }]);
    deps.feedback.findMany.mockResolvedValue([{ id: "f1", comments: "Great service" }]);

    const result = await service.search({
      actorRole: "EMPLOYEE",
      query: "jo",
    });

    expect(result).toHaveLength(3);
  });

  it("blocks search for viewer role", async () => {
    const service = createSearchService(createDeps() as never);

    await expect(
      service.search({
        actorRole: "VIEWER",
        query: "john",
      }),
    ).rejects.toThrow("Viewers cannot access global search.");
  });
});
