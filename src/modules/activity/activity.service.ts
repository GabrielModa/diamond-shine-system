import type { ActivityEntry, ListActivityFeedInput, RecordActivityInput } from "./activity.types";

type ActivityDeps = {
  activity: {
    create: (args: {
      data: {
        actorId: string;
        action: string;
        entity: string;
        entityId: string;
        metadata?: unknown;
      };
    }) => Promise<ActivityEntry>;
    findMany: (args: {
      where?: {
        actorId?: string;
      };
      orderBy: {
        createdAt: "desc";
      };
      take: number;
    }) => Promise<ActivityEntry[]>;
  };
};

export function createActivityService(deps: ActivityDeps) {
  return {
    async record(input: RecordActivityInput): Promise<ActivityEntry> {
      return deps.activity.create({
        data: {
          action: input.action,
          actorId: input.actorId,
          entity: input.entity,
          entityId: input.entityId,
          metadata: input.metadata,
        },
      });
    },

    async listFeed(input: ListActivityFeedInput): Promise<ActivityEntry[]> {
      return deps.activity.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        where:
          input.actorRole === "ADMIN"
            ? undefined
            : {
                actorId: input.actorId,
              },
      });
    },
  };
}

export function createActivityServiceFromPrisma(prisma: ActivityDeps) {
  return createActivityService(prisma);
}
