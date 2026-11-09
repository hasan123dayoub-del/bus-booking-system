import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models";
import { normalizeSyrianPhone } from "../utils/phone";

async function main() {
  const name = process.env.ADMIN_NAME ?? "المدير";
  const phone = normalizeSyrianPhone(process.env.ADMIN_PHONE ?? "");
  const password = process.env.ADMIN_PASSWORD;
  if (!phone || !password) {
    throw new Error("Set ADMIN_PHONE (Syrian number) and ADMIN_PASSWORD in .env");
  }

  await connectDB();
  const existing = await User.findOne({ phone });
  if (existing) {
    console.log("Admin already exists:", phone);
  } else {
    await User.create({
      name,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
    });
    console.log("Admin created:", phone);
  }
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
