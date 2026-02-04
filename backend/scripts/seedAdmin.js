import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config();

const pepperPassword = (password) => {
  if (!process.env.PASSWORD_PEPPER) {
    throw new Error("Chưa cấu hình PASSWORD_PEPPER trong file .env");
  }

  // Dùng HMAC-SHA256 để trộn password và pepper
  // Kết quả trả về là chuỗi hex 64 ký tự (vừa vặn giới hạn 72 bytes của Bcrypt)
  return crypto
    .createHmac("sha256", process.env.PASSWORD_PEPPER)
    .update(password)
    .digest("hex");
};

const seed = async () => {
  await connectDB();

  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";
  const phone = process.env.SEED_ADMIN_PHONE || "0000000000";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";

  try {
    let user = await User.findOne({ username });
    if (user) {
      console.log("Admin user already exists:", username);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
        const passwordWithPepper = pepperPassword(password);
        const hashedPassword = await bcrypt.hash(passwordWithPepper, salt);

    user = new User({ username, email, password: hashedPassword, name, phone, role: "admin" });
    await user.save();

    console.log("Created admin user:", username);
    console.log("Password:", password);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
