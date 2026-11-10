import { z } from "zod";
import { BUS_CLASSES, TRIP_STATUSES } from "../constants";
import {
  city,
  dateString,
  differentCities,
  objectId,
  price,
  sameCityMessage,
  timeString,
} from "./common";

export const searchTripsQuery = z
  .object({ from: city, to: city, date: dateString, class: z.enum(BUS_CLASSES).optional() })
  .refine(differentCities, sameCityMessage);

export const staffTripsQuery = z.object({
  date: dateString,
  from: city.optional(),
  to: city.optional(),
});

export const adminTripsQuery = z.object({
  from: dateString.optional(), // departure date range
  to: dateString.optional(),
  status: z.enum(TRIP_STATUSES).optional(),
  q: z.string().trim().optional(), // city name or plate number
});

const tripFields = z.object({
  from: city,
  to: city,
  busId: objectId,
  seatPrice: price,
  date: dateString, // Damascus date
  time: timeString, // Damascus time
});

export const createTripSchema = tripFields.refine(differentCities, sameCityMessage);

export const updateTripSchema = tripFields
  .partial()
  .refine((v) => Object.keys(v).length > 0, "لا توجد حقول للتعديل")
  .refine(differentCities, sameCityMessage);

export const tripStatusSchema = z.object({ status: z.enum(["DEPARTED", "ARRIVED"]) });
