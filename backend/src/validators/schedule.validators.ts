import { z } from "zod";
import { FREQUENCIES } from "../constants";
import { city, dateString, objectId, price, sameCityMessage, timeString } from "./common";

const base = z.object({
  from: city,
  to: city,
  busId: objectId,
  seatPrice: price,
  departureTime: timeString,
  frequency: z.enum(FREQUENCIES),
  days: z.array(z.number().int().min(0).max(31)).default([]),
  startDate: dateString,
  endDate: dateString,
  active: z.boolean().default(true),
});

type ScheduleShape = Partial<z.infer<typeof base>>;

function check(v: ScheduleShape, ctx: z.RefinementCtx) {
  if (v.from && v.to && v.from === v.to) {
    ctx.addIssue({ code: "custom", ...sameCityMessage });
  }
  if (v.startDate && v.endDate && v.endDate < v.startDate) {
    ctx.addIssue({
      code: "custom",
      message: "تاريخ النهاية قبل تاريخ البداية",
      path: ["endDate"],
    });
  }
  if (!v.frequency) return;
  const days = v.days ?? [];
  if (v.frequency === "WEEKLY" && (days.length === 0 || days.some((d) => d > 6))) {
    ctx.addIssue({
      code: "custom",
      message: "اختر يوماً واحداً على الأقل من أيام الأسبوع",
      path: ["days"],
    });
  }
  if (v.frequency === "MONTHLY" && (days.length !== 1 || days[0] < 1)) {
    ctx.addIssue({
      code: "custom",
      message: "اختر يوماً واحداً من الشهر (1-31)",
      path: ["days"],
    });
  }
}

const cleanDays = <T extends ScheduleShape>(v: T): T => ({
  ...v,
  days:
    v.days === undefined
      ? undefined
      : v.frequency === "DAILY"
        ? []
        : [...new Set(v.days)].sort((a, b) => a - b),
});

export const createScheduleSchema = base.superRefine(check).transform(cleanDays);

/** On update the whole schedule is sent again (the form always has every field). */
export const updateScheduleSchema = createScheduleSchema;

export { objectId };
