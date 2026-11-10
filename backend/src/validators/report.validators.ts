import { z } from "zod";
import { dateString } from "./common";

export const reportQuery = z
  .object({ from: dateString, to: dateString })
  .refine((v) => v.from <= v.to, { message: "تاريخ البداية بعد تاريخ النهاية", path: ["from"] });
