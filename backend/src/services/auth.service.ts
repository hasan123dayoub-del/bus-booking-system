import bcrypt from "bcryptjs";
import { User } from "../models";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";

export async function registerCustomer(input: { name: string; phone: string; password: string }) {
  if (await User.exists({ phone: input.phone })) {
    throw new AppError(409, "PHONE_TAKEN", "هذا الرقم مسجّل مسبقاً");
  }
  const user = await User.create({
    name: input.name,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 10),
    role: "CUSTOMER", // registration can never create staff
  });
  return { user, token: signToken({ sub: user.id, role: "CUSTOMER" }) };
}

export async function login(phone: string, password: string) {
  const user = await User.findOne({ phone });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "رقم الهاتف أو كلمة المرور غير صحيحة");
  }
  if (!user.active) {
    throw new AppError(403, "ACCOUNT_DISABLED", "الحساب معطّل");
  }
  return { user, token: signToken({ sub: user.id, role: user.role }) };
}
