import { z } from "zod";
import { BUS_CLASSES, BUS_SIZES, BUS_STATUSES } from "../constants";

export const createBusSchema = z.object({
  plateNumber: z.string().trim().min(1, "رقم اللوحة مطلوب"),
  busClass: z.enum(BUS_CLASSES),
  size: z.enum(BUS_SIZES),
  status: z.enum(BUS_STATUSES).optional(),
});

export const updateBusSchema = createBusSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "لا توجد حقول للتعديل");
