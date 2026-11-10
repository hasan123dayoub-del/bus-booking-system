import bcrypt from "bcryptjs";
import { Booking, User } from "../models";
import { AppError } from "../utils/AppError";

export async function listReceptionists() {
  return User.find({ role: "RECEPTIONIST" }).sort({ active: -1, createdAt: -1 });
}

export async function createReceptionist(input: { name: string; phone: string; password: string }) {
  if (await User.exists({ phone: input.phone })) {
    throw new AppError(409, "PHONE_TAKEN", "هذا الرقم مسجّل مسبقاً");
  }
  return User.create({
    name: input.name,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 10),
    role: "RECEPTIONIST",
  });
}

export async function updateReceptionist(
  id: string,
  input: { name?: string; phone?: string; password?: string; active?: boolean },
) {
  const user = await User.findOne({ _id: id, role: "RECEPTIONIST" });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "موظف الاستقبال غير موجود");
  if (input.phone && input.phone !== user.phone && (await User.exists({ phone: input.phone }))) {
    throw new AppError(409, "PHONE_TAKEN", "هذا الرقم مسجّل مسبقاً");
  }
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.active !== undefined) user.active = input.active;
  if (input.password) user.passwordHash = await bcrypt.hash(input.password, 10);
  await user.save();
  return user;
}

/** Staff who already made bookings are kept (deactivate them instead) so the history stays readable. */
export async function deleteReceptionist(id: string) {
  const user = await User.findOne({ _id: id, role: "RECEPTIONIST" });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "موظف الاستقبال غير موجود");
  if (await Booking.exists({ createdBy: user._id })) {
    throw new AppError(409, "USER_HAS_BOOKINGS", "للموظف حجوزات مسجّلة، عطّل حسابه بدل حذفه");
  }
  await user.deleteOne();
}
