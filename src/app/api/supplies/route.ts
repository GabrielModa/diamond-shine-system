import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { createSuppliesServiceFromPrisma } from "../../../modules/supplies/supplies.service";
import type { ListSupplyRequestsInput } from "../../../modules/supplies/supplies.types";
import type { UserRole } from "../../../types/user";

type ReviewSupplyPayload = {
  action: "approve" | "reject";
  requestId: string;
};

type CreateSupplyPayload = {
  item: string;
  quantity: number;
  department: string;
};

function getService() {
  return createSuppliesServiceFromPrisma({
    auditLog: prisma.auditLog,
    supplyRequest: prisma.supplyRequest,
  });
}

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const input: ListSupplyRequestsInput = {
      actorRole: sessionUser.role,
      department: searchParams.get("department") ?? undefined,
    };

    if (sessionUser.role === "EMPLOYEE") {
      input.requesterId = sessionUser.id;
    } else {
      input.requesterId = searchParams.get("requesterId") ?? undefined;
    }

    const result = await getService().listSupplyRequests(input);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateSupplyPayload;
    const result = await getService().createSupplyRequest({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      department: payload.department,
      item: payload.item,
      quantity: payload.quantity,
      requesterId: sessionUser.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as ReviewSupplyPayload;

    if (payload.action === "approve") {
      const result = await getService().approveRequest({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        requestId: payload.requestId,
      });
      return NextResponse.json(result);
    }

    if (payload.action === "reject") {
      const result = await getService().rejectRequest({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        requestId: payload.requestId,
      });
      return NextResponse.json(result);
    }

    throw new Error("Invalid supplies action.");
  } catch (error) {
    return toErrorResponse(error);
  }
}
