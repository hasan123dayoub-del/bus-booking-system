import { z } from "zod";
import { CITY_CODES } from "../constants";
import { DATE_RE, TIME_RE } from "../utils/time";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "معرّف غير صالح");
export const dateString = z.string().regex(DATE_RE, "صيغة التاريخ YYYY-MM-DD");
export const timeString = z.string().regex(TIME_RE, "صيغة الوقت HH:mm");
export const city = z.enum(CITY_CODES, { errorMap: () => ({ message: "مدينة غير معروفة" }) });
export const price = z.coerce.number().int("السعر رقم صحيح").min(0, "السعر لا يكون سالباً");

export const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const differentCities = (v: { from?: string; to?: string }) =>
  !v.from || !v.to || v.from !== v.to;
export const sameCityMessage = { message: "مدينة الانطلاق والوصول متطابقتان", path: ["to"] };
