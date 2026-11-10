import { z } from "zod";
import { phoneSchema } from "../utils/phone";

const password = z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72);

export const createReceptionistSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(60),
  phone: phoneSchema,
  password,
});

export const updateReceptionistSchema = z
  .object({
    name: z.string().trim().min(2, "الاسم قصير جداً").max(60),
    phone: phoneSchema,
    password,
    active: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "لا توجد حقول للتعديل");
