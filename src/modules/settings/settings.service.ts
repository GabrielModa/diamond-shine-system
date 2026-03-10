import type { UserRole } from "../../types/user";
import type { Setting, UpsertSettingInput } from "./settings.types";

type SettingsDeps = {
  setting: {
    upsert: (args: {
      where: { key: string };
      create: { key: string; value: string; updatedBy: string };
      update: { value: string; updatedBy: string };
    }) => Promise<Setting>;
    findUnique: (args: { where: { key: string } }) => Promise<Setting | null>;
    findMany: (args: { orderBy: { updatedAt: "desc" }; take: number }) => Promise<Setting[]>;
  };
};

function assertCanManageSettings(role: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Only admins can update system settings.");
  }
}

export function createSettingsService(deps: SettingsDeps) {
  return {
    async upsertSetting(input: UpsertSettingInput): Promise<Setting> {
      assertCanManageSettings(input.actorRole);

      return deps.setting.upsert({
        create: {
          key: input.key,
          updatedBy: input.actorId,
          value: input.value,
        },
        update: {
          updatedBy: input.actorId,
          value: input.value,
        },
        where: {
          key: input.key,
        },
      });
    },

    async listSettings(): Promise<Setting[]> {
      return deps.setting.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
    },

    async getSetting(key: string): Promise<Setting | null> {
      return deps.setting.findUnique({
        where: { key },
      });
    },
  };
}

export function createSettingsServiceFromPrisma(prisma: SettingsDeps) {
  return createSettingsService(prisma);
}
