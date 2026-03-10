import type { SearchInput, SearchResult } from "./search.types";

type SearchDeps = {
  user: {
    findMany: (args: {
      where: {
        OR: Array<{ email?: { contains: string; mode: "insensitive" }; name?: { contains: string; mode: "insensitive" } }>;
      };
      take: number;
      select: {
        id: true;
        email: true;
        name: true;
      };
    }) => Promise<Array<{ id: string; email: string; name: string | null }>>;
  };
  supplyRequest: {
    findMany: (args: {
      where: {
        item: {
          contains: string;
          mode: "insensitive";
        };
      };
      take: number;
      select: {
        id: true;
        item: true;
      };
    }) => Promise<Array<{ id: string; item: string }>>;
  };
  feedback: {
    findMany: (args: {
      where: {
        comments: {
          contains: string;
          mode: "insensitive";
        };
      };
      take: number;
      select: {
        id: true;
        comments: true;
      };
    }) => Promise<Array<{ id: string; comments: string }>>;
  };
};

function assertCanSearch(actorRole: SearchInput["actorRole"]) {
  if (actorRole === "VIEWER") {
    throw new Error("Viewers cannot access global search.");
  }
}

export function createSearchService(deps: SearchDeps) {
  return {
    async search(input: SearchInput): Promise<SearchResult[]> {
      assertCanSearch(input.actorRole);

      const limit = input.limit ?? 5;
      const query = input.query.trim();
      if (!query) {
        return [];
      }

      const [users, supplies, feedback] = await Promise.all([
        deps.user.findMany({
          select: {
            email: true,
            id: true,
            name: true,
          },
          take: limit,
          where: {
            OR: [
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
        }),
        deps.supplyRequest.findMany({
          select: {
            id: true,
            item: true,
          },
          take: limit,
          where: {
            item: {
              contains: query,
              mode: "insensitive",
            },
          },
        }),
        deps.feedback.findMany({
          select: {
            comments: true,
            id: true,
          },
          take: limit,
          where: {
            comments: {
              contains: query,
              mode: "insensitive",
            },
          },
        }),
      ]);

      return [
        ...users.map((row) => ({
          entity: "users" as const,
          id: row.id,
          label: row.name ? `${row.name} (${row.email})` : row.email,
        })),
        ...supplies.map((row) => ({
          entity: "supplies" as const,
          id: row.id,
          label: row.item,
        })),
        ...feedback.map((row) => ({
          entity: "feedback" as const,
          id: row.id,
          label: row.comments,
        })),
      ];
    },
  };
}

export function createSearchServiceFromPrisma(prisma: SearchDeps) {
  return createSearchService(prisma);
}
