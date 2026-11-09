import { Schema, model } from "mongoose";
import { BUS_CLASSES, BUS_SIZES, BUS_STATUSES } from "../constants";

const busSchema = new Schema(
  {
    plateNumber: { type: String, required: true, unique: true, trim: true },
    busClass: { type: String, enum: [...BUS_CLASSES], required: true },
    size: { type: String, enum: [...BUS_SIZES], required: true },
    status: { type: String, enum: [...BUS_STATUSES], default: "ACTIVE" },
  },
  { timestamps: true },
);

export const Bus = model("Bus", busSchema);
