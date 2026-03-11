import type { UserRole } from "../../types/user";
import type { FileRecord, RegisterFileInput } from "./files.types";

type FilesDeps = {
  file: {
    create: (args: { data: { filename: string; mimeType: string; sizeBytes: number; uploadedBy: string } }) => Promise<FileRecord>;
    findMany: (args: { orderBy: { createdAt: "desc" }; take: number }) => Promise<FileRecord[]>;
  };
  activity?: {
    create: (args: { data: { actorId: string; action: string; entity: string; entityId: string; metadata?: unknown } }) => Promise<unknown>;
  };
};

function assertCanUploadFiles(role: UserRole) {
  if (role === "VIEWER") throw new Error("Viewers cannot upload files.");
}

export function createFilesService(deps: FilesDeps) {
  return {
    async listFiles(): Promise<FileRecord[]> {
      return deps.file.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    },

    async registerUpload(input: RegisterFileInput): Promise<FileRecord> {
      assertCanUploadFiles(input.actorRole);
      const record = await deps.file.create({
        data: { filename: input.filename, mimeType: input.mimeType, sizeBytes: input.sizeBytes, uploadedBy: input.actorId },
      });
      await deps.activity?.create({ data: { action: "FILE_UPLOADED", actorId: input.actorId, entity: "File", entityId: record.id, metadata: { filename: record.filename } } });
      return record;
    },
  };
}

export function createFilesServiceFromPrisma(prisma: FilesDeps) {
  return createFilesService(prisma);
}
