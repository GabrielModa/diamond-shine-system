import { z } from "zod";

export const createSupplySchema = z.object({
  department: z.string().min(1),
  item: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const reviewSupplySchema = z.object({
  action: z.enum(["approve", "reject", "complete"]),
  requestId: z.string().min(1),
});
