import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { registerFileSchema } from "../../../lib/validation/new-modules.schema";
import { createFilesServiceFromPrisma } from "../../../modules/files/files.service";

const getService = () => createFilesServiceFromPrisma({ activity: prisma.activity, file: prisma.file });

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    const filename = new URL(request.url).searchParams.get("filename");
    if (filename) {
      const filePath = path.join(process.cwd(), "uploads", path.basename(filename));
      const content = await readFile(filePath);
      return withTraceId(new NextResponse(content, { headers: { "Content-Disposition": `attachment; filename=\"${path.basename(filename)}\"` } }), traceId);
    }

    return withTraceId(NextResponse.json(await getService().listFiles()), traceId);
  } catch (error) {
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 400 }), traceId);
  }
}

async function registerMetadata(user: { id: string; role: "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER" }, filename: string, mimeType: string, sizeBytes: number, traceId: string) {
  const payload = validateSchema(registerFileSchema, { filename, mimeType, sizeBytes });
  const record = await getService().registerUpload({ ...payload, actorId: user.id, actorRole: user.role });
  return withTraceId(NextResponse.json(record, { status: 201 }), traceId);
}

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return withTraceId(NextResponse.json({ error: "File is required." }, { status: 400 }), traceId);

      const uploadsPath = path.join(process.cwd(), "uploads");
      await mkdir(uploadsPath, { recursive: true });
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      await writeFile(path.join(uploadsPath, safeName), Buffer.from(await file.arrayBuffer()));
      return registerMetadata(user, safeName, file.type || "application/octet-stream", file.size, traceId);
    }

    const payload = validateSchema(registerFileSchema, await request.json());
    return withTraceId(NextResponse.json(await getService().registerUpload({ ...payload, actorId: user.id, actorRole: user.role }), { status: 201 }), traceId);
  } catch (error) {
    const status = error instanceof SchemaValidationError ? error.status : 400;
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status }), traceId);
  }
}
