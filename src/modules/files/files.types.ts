import type { UserRole } from "../../types/user";

export type RegisterFileInput = {
  actorId: string;
  actorRole: UserRole;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export type FileRecord = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: Date;
};
