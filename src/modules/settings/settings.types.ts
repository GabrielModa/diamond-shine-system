import type { UserRole } from "../../types/user";

export type UpsertSettingInput = {
  actorId: string;
  actorRole: UserRole;
  key: string;
  value: string;
};

export type Setting = {
  key: string;
  value: string;
  updatedBy: string;
  updatedAt: Date;
};
