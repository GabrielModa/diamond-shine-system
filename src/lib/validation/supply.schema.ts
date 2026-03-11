import { z } from "zod";

export const createSupplySchema = z.object({
  department: z.string().min(1),
  item: z.string().min(1),
  notes: z.string().max(1000).optional(),
  priority: z.enum(["LOW", "NORMAL", "URGENT"]).default("NORMAL"),
  quantity: z.number().int().positive(),
});

export const reviewSupplySchema = z.object({
  action: z.enum(["approve", "reject", "complete"]),
  requestId: z.string().min(1),
});

export const notifyClientSchema = z.object({
  clientEmail: z.email(),
});
