import type { ZodType } from "zod";

export class SchemaValidationError extends Error {
  readonly status = 422;

  constructor(message: string) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

export function validateSchema<T>(schema: ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
      .join("; ");
    throw new SchemaValidationError(message || "Invalid request payload.");
  }

  return result.data;
}
