import { NextResponse } from "next/server";

export function withTraceId<T>(response: NextResponse<T>, traceId: string): NextResponse<T> {
  response.headers.set("x-request-id", traceId);
  return response;
}
