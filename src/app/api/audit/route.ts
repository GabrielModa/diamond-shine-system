import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { createAuditServiceFromPrisma } from "../../../modules/audit/audit.service";
import type { UserRole } from "../../../types/user";

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getSessionUser(): Promise<{ role: UserRole } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: UserRole } | undefined;

  if (!user?.role) {
    return null;
  }

  return {
    role: user.role,
  };
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await createAuditServiceFromPrisma({
      auditLog: prisma.auditLog,
    }).listAuditLogs({
      actorRole: sessionUser.role,
    });

    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message === "Only admins can view audit logs.") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return toErrorResponse(error);
  }
}
