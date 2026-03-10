import type { UserRole } from "../../types/user";

export type SearchEntity = "users" | "supplies" | "feedback";

export type SearchInput = {
  actorRole: UserRole;
  query: string;
  limit?: number;
};

export type SearchResult = {
  entity: SearchEntity;
  id: string;
  label: string;
};
