import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createSuppliesServiceFromPrisma } from "../../../modules/supplies/supplies.service";
import type { CreateSupplyRequestInput } from "../../../modules/supplies/supplies.types";
import type { UserRole } from "../../../types/user";

type ReviewSupplyPayload = {
  action: "approve" | "reject";
  actorRole: UserRole;
  requestId: string;
};

function getService() {
  return createSuppliesServiceFromPrisma({
    supplyRequest: prisma.supplyRequest,
  });
}

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

function getRequiredRole(searchParams: URLSearchParams): UserRole {
  const actorRole = searchParams.get("actorRole");
  if (!actorRole) {
    throw new Error("actorRole is required.");
  }
  return actorRole as UserRole;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getService().listSupplyRequests({
      actorRole: getRequiredRole(searchParams),
      department: searchParams.get("department") ?? undefined,
      requesterId: searchParams.get("requesterId") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateSupplyRequestInput;
    const result = await getService().createSupplyRequest(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as ReviewSupplyPayload;

    if (payload.action === "approve") {
      const result = await getService().approveRequest({
        actorRole: payload.actorRole,
        requestId: payload.requestId,
      });
      return NextResponse.json(result);
    }

    if (payload.action === "reject") {
      const result = await getService().rejectRequest({
        actorRole: payload.actorRole,
        requestId: payload.requestId,
      });
      return NextResponse.json(result);
    }

    throw new Error("Invalid supplies action.");
  } catch (error) {
    return toErrorResponse(error);
  }
}
