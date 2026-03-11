import type { UserRole } from "../../types/user";
import type { FileRecord, RegisterFileInput } from "./files.types";

type FilesDeps = {
  file: {
    create: (args: { data: { filename: string; mimeType: string; sizeBytes: number; uploadedBy: string } }) => Promise<FileRecord>;
    findMany: (args: { orderBy: { createdAt: "desc" }; take: number }) => Promise<FileRecord[]>;
  };
};

function assertCanUploadFiles(role: UserRole) {
  if (role === "VIEWER") {
    throw new Error("Viewers cannot upload files.");
  }
}

export function createFilesService(deps: FilesDeps) {
  return {
    async listFiles(): Promise<FileRecord[]> {
      return deps.file.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },

    async registerUpload(input: RegisterFileInput): Promise<FileRecord> {
      assertCanUploadFiles(input.actorRole);

      return deps.file.create({
        data: {
          filename: input.filename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          uploadedBy: input.actorId,
        },
      });
    },
  };
}

export function createFilesServiceFromPrisma(prisma: FilesDeps) {
  return createFilesService(prisma);
}
