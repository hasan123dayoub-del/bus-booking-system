import { z } from "zod";

/** Accepts 09XXXXXXXX, 9XXXXXXXX, +9639XXXXXXXX, 009639XXXXXXXX -> +9639XXXXXXXX */
export function normalizeSyrianPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");
  const m = cleaned.match(/^(?:\+963|00963|0)?(9\d{8})$/);
  return m ? `+963${m[1]}` : null;
}

export const phoneSchema = z.string().transform((v, ctx) => {
  const p = normalizeSyrianPhone(v);
  if (!p) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "رقم هاتف سوري غير صالح" });
    return z.NEVER;
  }
  return p;
});
