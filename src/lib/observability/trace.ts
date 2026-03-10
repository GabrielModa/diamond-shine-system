import { randomUUID } from "node:crypto";

type HeaderValue = string | string[] | undefined;

function getHeader(
  headers: Headers | Record<string, HeaderValue>,
  name: string,
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseTraceparent(value: string): string | null {
  const parts = value.split("-");
  if (parts.length < 3) {
    return null;
  }

  const traceId = parts[1];
  if (traceId && traceId.length === 32) {
    return traceId;
  }

  return null;
}

export function getTraceId(
  headers?: Headers | Record<string, HeaderValue> | null,
): string {
  if (!headers) {
    return randomUUID();
  }

  const traceparent = getHeader(headers, "traceparent");
  if (traceparent) {
    const traceId = parseTraceparent(traceparent);
    if (traceId) {
      return traceId;
    }
  }

  const requestId =
    getHeader(headers, "x-request-id") ??
    getHeader(headers, "x-correlation-id") ??
    getHeader(headers, "x-amzn-trace-id");

  if (requestId) {
    return requestId;
  }

  return randomUUID();
}
