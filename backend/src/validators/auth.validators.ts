import { z } from "zod";
import { phoneSchema } from "../utils/phone";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(60),
  phone: phoneSchema,
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "أدخل كلمة المرور"),
});
