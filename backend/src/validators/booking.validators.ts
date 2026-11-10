import { z } from "zod";
import { BOOKING_STATUSES, MAX_SEATS_PER_BOOKING, PAYMENT_METHODS } from "../constants";
import { phoneSchema } from "../utils/phone";
import { dateString, objectId, pageQuery } from "./common";

const seats = z
  .array(
    z.object({
      seatNumber: z.number().int().min(1),
      // Optional: defaults to the customer's name
      passengerName: z.string().trim().max(60).optional(),
    }),
  )
  .min(1, "اختر مقعداً واحداً على الأقل")
  .max(MAX_SEATS_PER_BOOKING, `الحد الأقصى ${MAX_SEATS_PER_BOOKING} مقاعد في الحجز`)
  .refine((s) => new Set(s.map((x) => x.seatNumber)).size === s.length, "مقعد مكرر في الطلب");

const shamCashRef = z.string().trim().min(4, "أدخل رقم عملية شام كاش").max(40);

/** Customer app: Sham Cash only, the transfer number is required. */
export const appBookingSchema = z.object({
  tripId: objectId,
  seats,
  paymentRef: shamCashRef,
});

/** Office: cash or Sham Cash. */
export const staffBookingSchema = z
  .object({
    tripId: objectId,
    customerName: z.string().trim().min(2, "أدخل اسم الزبون").max(60),
    customerPhone: phoneSchema,
    seats,
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentRef: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.paymentMethod === "CASH" || (v.paymentRef ?? "").length >= 4, {
    message: "أدخل رقم عملية شام كاش",
    path: ["paymentRef"],
  });

export const changeSeatSchema = z.object({
  seatNumber: z.number().int().min(1),
  newSeatNumber: z.number().int().min(1),
});

export const staffBookingsQuery = z.object({
  q: z.string().trim().optional(), // booking code, customer name or phone
  date: dateString.optional(), // trip departure date
  tripId: objectId.optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  refunded: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  ...pageQuery,
});
