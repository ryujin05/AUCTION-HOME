import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Import jwt
import dotenv from "dotenv";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import crypto from "crypto";
import { jwtDecode } from "jwt-decode";
import { OAuth2Client } from "google-auth-library";
import { sendEmailViaBrevo } from "../utils/sendEmail.js";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const pepperPassword = (password) => {
  if (!process.env.PASSWORD_PEPPER) {
    throw new Error("Chưa cấu hình PASSWORD_PEPPER trong file .env");
  }

  return crypto
    .createHmac("sha256", process.env.PASSWORD_PEPPER)
    .update(password)
    .digest("hex");
};

export const userRegister = async (req, res) => {
  try {
    const { password, name, phone, role, email } = req.body;

    // 1. Kiểm tra Email
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Thiếu email" });
    }

    // Regex đơn giản để check format email (có @ và dấu chấm)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    // 2. Kiểm tra Password
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    // 3. Kiểm tra Tên
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Thiếu tên người dùng" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Gmail đang dùng đã tồn tại",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordWithPepper = pepperPassword(password);
    const hashedPassword = await bcrypt.hash(passwordWithPepper, salt);

    const username = email.split("@")[0];

    user = new User({
      username: username,
      password: hashedPassword,
      name: name,
      phone: phone,
      role: role || "member",
      email: email,
      emailVerified: true,
    });

    await user.save({ validateBeforeSave: false });

    // try {
    //   await sendEmail({
    //     email: user.email,
    //     subject: "Xác minh email",
    //     message,
    //   });
    // } catch (err) {
    //   console.error("Failed to send verification email", err);
    // }

    const { password: userPassword, ...userInfo } = user._doc;

    return res.status(201).json({
      message: "Tài khoản đã được tạo và tự động xác thực.",
      user: userInfo,
      verificationRequired: false,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    // Generate verification code and send email
    const code = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    const htmlMessage = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
    
    <h2 style="color: #333; text-align: center; margin-top: 0;">Gửi lại mã xác thực</h2>
    
    <p style="font-size: 16px; color: #555;">Xin chào <strong>${user.name}</strong>,</p>
    
    <p style="font-size: 16px; color: #555;">Đây là tin nhắn gửi lại mã xác thực. Để hoàn tất, vui lòng sử dụng mã xác thực dưới đây:</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
      <h1 style="color: #007bff; letter-spacing: 5px; margin: 0; font-size: 32px;">${code}</h1>
      <p style="margin-top: 10px; font-size: 14px; color: #888;">(Mã có hiệu lực trong 4 phút)</p>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

    <div style="font-size: 14px; color: #999; line-height: 1.5;">
      <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
      <p style="margin-top: 5px;">Để không bỏ lỡ các thông báo quan trọng tiếp theo, hãy đánh dấu email này là <em>"Không phải Spam" (Not Spam)</em>.</p>
    </div>

  </div>
`;

    // --- GỌI HÀM GỬI MAIL ---
    try {
      console.log(`Đang gửi mail tới: ${user.email}`);

      // Gọi hàm API mới (nhớ await)
      await sendEmailViaBrevo(user.email, "Gửi lại mã xác thực", htmlMessage);

      console.log("Gửi mail thành công!");
    } catch (emailError) {
      console.error("Không gửi được mail:", emailError.message);
      // Tùy chọn: return lỗi hoặc cho qua tùy logic của bạn
    }

    return res.json({
      message: "Mã xác thực đã được gửi lại",
      ...(process.env.NODE_ENV !== "production" ? { verificationCode: code } : {}),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: "Missing email or code" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    const hashed = crypto.createHash("sha256").update(code).digest("hex");
    if (
      user.emailVerificationCode !== hashed ||
      !user.emailVerificationExpire ||
      user.emailVerificationExpire < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn" });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    generateTokenAndSetCookie(res, user._id, user.role);

    const { password: _p, ...userInfo } = user._doc;
    return res.json({ message: "Xác thực thành công", user: userInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = user.generateResetPasswordCode();
    await user.save({ validateBeforeSave: false });

    const htmlMessage = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
    
    <h2 style="color: #333; text-align: center; margin-top: 0;">Đặt lại mật khẩu</h2>
    
    <p style="font-size: 16px; color: #555;">Xin chào <strong>${user.name}</strong>,</p>
    
    <p style="font-size: 16px; color: #555;">Để hoàn tất đặt lại mật khẩu, vui lòng sử dụng mã xác thực dưới đây:</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
      <h1 style="color: #007bff; letter-spacing: 5px; margin: 0; font-size: 32px;">${code}</h1>
      <p style="margin-top: 10px; font-size: 14px; color: #888;">(Mã có hiệu lực trong 4 phút)</p>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

    <div style="font-size: 14px; color: #999; line-height: 1.5;">
      <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
      <p style="margin-top: 5px;">Để không bỏ lỡ các thông báo quan trọng tiếp theo, hãy đánh dấu email này là <em>"Không phải Spam" (Not Spam)</em>.</p>
    </div>

  </div>
`;

    // --- GỌI HÀM GỬI MAIL ---
    try {
      console.log(`Đang gửi mail tới: ${user.email}`);

      // Gọi hàm API mới (nhớ await)
      await sendEmailViaBrevo(user.email, "Mã đặt lại mật khẩu", htmlMessage);

      console.log("Gửi mail thành công!");
    } catch (emailError) {
      console.error("Không gửi được mail:", emailError.message);
      // Tùy chọn: return lỗi hoặc cho qua tùy logic của bạn
    }

    return res.json({ message: "Mã đặt lại mật khẩu đã được gửi" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const requestChangePassword = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.userId; // Lấy từ middleware verifyToken

    if (!currentPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập mật khẩu hiện tại" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Kiểm tra mật khẩu hiện tại có đúng không
    const currentPasswordWithPepper = pepperPassword(currentPassword);
    const isMatch = await bcrypt.compare(
      currentPasswordWithPepper,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // 2. Nếu đúng, tạo Code xác thực
    const code = user.generateResetPasswordCode();
    await user.save({ validateBeforeSave: false });

    const htmlMessage = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
    
    <h2 style="color: #333; text-align: center; margin-top: 0;">Xác thực đăng ký</h2>
    
    <p style="font-size: 16px; color: #555;">Xin chào <strong>${user.name}</strong>,</p>
    
    <p style="font-size: 16px; color: #555;">Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất, vui lòng sử dụng mã xác thực dưới đây:</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
      <h1 style="color: #007bff; letter-spacing: 5px; margin: 0; font-size: 32px;">${code}</h1>
      <p style="margin-top: 10px; font-size: 14px; color: #888;">(Mã có hiệu lực trong 4 phút)</p>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

    <div style="font-size: 14px; color: #999; line-height: 1.5;">
      <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
      <p style="margin-top: 5px;">Để không bỏ lỡ các thông báo quan trọng tiếp theo, hãy đánh dấu email này là <em>"Không phải Spam" (Not Spam)</em>.</p>
    </div>

  </div>
`;

    // --- GỌI HÀM GỬI MAIL ---
    try {
      console.log(`Đang gửi mail tới: ${user.email}`);

      // Gọi hàm API mới (nhớ await)
      await sendEmailViaBrevo(user.email, "Đổi Mật Khẩu", htmlMessage);

      console.log("Gửi mail thành công!");
    } catch (emailError) {
      console.error("Không gửi được mail:", emailError.message);
      // Tùy chọn: return lỗi hoặc cho qua tùy logic của bạn
    }

    return res.status(200).json({
      message:
        "Mật khẩu hiện tại đúng. Mã xác nhận đã được gửi tới email của bạn.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// export const verifyAndChangePassword = async (req, res) => {
//   try {
//     const { code, newPassword } = req.body;
//     const userId = req.user._id;

//     if (!code || !newPassword) {
//       return res.status(400).json({ message: "Thiếu thông tin xác thực" });
//     }
    
//     if (newPassword.length < 6) {
//         return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // 1. Kiểm tra Code
//     const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

//     if (
//       user.resetPasswordCode !== hashedCode ||
//       !user.resetPasswordCodeExpire ||
//       user.resetPasswordCodeExpire < Date.now()
//     ) {
//       return res.status(400).json({ message: "Mã xác thực không đúng hoặc đã hết hạn" });
//     }

//     // 2. Hash mật khẩu MỚI
//     // (Lưu ý: Không cần check lại mật khẩu cũ nữa vì đã check ở bước 1 rồi)
//     const salt = await bcrypt.genSalt(10);
//     const newPasswordWithPepper = pepperPassword(newPassword);
//     const hashedPassword = await bcrypt.hash(newPasswordWithPepper, salt);

//     // 3. Update DB
//     user.password = hashedPassword;
//     user.resetPasswordCode = undefined;
//     user.resetPasswordCodeExpire = undefined;
//     await user.save();

//     return res.status(200).json({ message: "Đổi mật khẩu thành công!" });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Lỗi server" });
//   }
// };

export const verifyAndChangeCurrentPassword = async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    const userId = req.userId;

    if (!code || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin xác thực" });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Kiểm tra Code
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    if (
      user.resetPasswordCode !== hashedCode ||
      !user.resetPasswordCodeExpire ||
      user.resetPasswordCodeExpire < Date.now()
    ) {
      return res.status(400).json({ message: "Mã xác thực không đúng hoặc đã hết hạn" });
    }

    // 2. Hash mật khẩu MỚI
    // (Lưu ý: Không cần check lại mật khẩu cũ nữa vì đã check ở bước 1 rồi)
    const salt = await bcrypt.genSalt(10);
    const newPasswordWithPepper = pepperPassword(newPassword);
    const hashedPassword = await bcrypt.hash(newPasswordWithPepper, salt);

    // 3. Update DB
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpire = undefined;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công!" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password)
      return res.status(400).json({ message: "Missing params" });

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = crypto.createHash("sha256").update(code).digest("hex");
    if (
      user.resetPasswordCode !== hashed ||
      !user.resetPasswordCodeExpire ||
      user.resetPasswordCodeExpire < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Mã không hợp lệ hoặc đã hết hạn" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordWithPepper = pepperPassword(password);
    user.password = await bcrypt.hash(passwordWithPepper, salt);
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpire = undefined;
    await user.save();

    // Auto login after password reset
    generateTokenAndSetCookie(res, user._id, user.role);

    return res.json({ message: "Mật khẩu đã được cập nhật" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  // ... (Giữ nguyên logic xóa user, nhưng lưu ý quyền admin nếu cần)
  try {
    const id = req.params.id;
    const deleteUser = await User.findByIdAndDelete(id);

    if (!deleteUser) {
      return res.status(404).json({
        message: "Not Found",
      });
    }

    return res.json({
      messgae: "Người dùng được xóa thành công",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Not Enough Information",
      });
    }

    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Email incorrect",
      });
    }

    // If account is banned, prevent login
    if (user.isBanned) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    const passwordWithPepper = pepperPassword(password);

    const match = await bcrypt.compare(passwordWithPepper, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Password wrong",
      });
    }

    generateTokenAndSetCookie(res, user._id, user.role);

    const { password: userPassword, ...userInfo } = user._doc;

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user: userInfo,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const loginGoogle = async (req, res) => {
  try {
    const { tokenGoogle } = req.body;

    // Kiểm tra nếu không có token
    if (!tokenGoogle) {
      return res.status(400).json({ message: "Missing Google token" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokenGoogle,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    //Verify thành công -> lấy data user từ payload
    const dataUser = ticket.getPayload();

    console.log("User verified:", dataUser);

    let user = await User.findOne({ email: dataUser.email });

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const generatedUsername = dataUser.email.split("@")[0];

      user = await User.create({
        username: generatedUsername,
        name: dataUser.name,
        email: dataUser.email,
        password: hashedPassword,
        phone: "Chưa cập nhật",
        role: "guest",
        emailVerified: true,
      });
    }

    // Prevent banned users logging in via Google
    if (user.isBanned) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    generateTokenAndSetCookie(res, user._id, user.role);

    const { password: userPassword, ...userInfo } = user._doc;

    res
      .status(200)
      .json({ success: true, user: userInfo, message: "Login Google Success" });
  } catch (error) {
    console.error("Error verifying Google token: ", error);
    res.status(401).json({ message: "Token không hợp lệ hoặc giả mạo" });
  }
};

export const getUserInfor = async (req, res) => {
  try {
    const user_id = req.userId;

    const user = await User.findById(user_id).select(
      "username name phone email role avatar createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    res.json({
      message: "Thông tin người dùng mới nhất",
      user: user,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateUserInfo = async (req, res) => {
  try {
    // --- JWT: Lấy userId từ req.userId ---
    const user_id = req.userId;

    const { name, phone } = req.body;
    if (!name && !phone) {
      return res.status(400).json({
        message: "Vui long cung cap thong tin can cap nhat",
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { $set: updateFields },
      { new: true }
    ).select("name phone role createdAt");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    res.json({
      message: "Cập nhật thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const checkSession = (req, res) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "No active session", user: null });

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err)
      return res.status(401).json({ message: "Invalid Token", user: null });

    const user = await User.findById(payload._id).select("-password");
    return res.status(200).json({
      message: "Session active",
      user: user,
    });
  });
};

export const logoutUser = async (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    })
    .status(200)
    .json({ message: "Đã đăng xuất" });
};

export const toggleSaveListing = async (req, res) => {
  try {
    // --- JWT: Lấy userId từ req.userId ---
    const userId = req.userId;

    const listingId = req.params.listingId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const idx = user.savedListings
      ? user.savedListings.findIndex(
          (id) => id.toString() === listingId.toString()
        )
      : -1;
    if (idx === -1) {
      // add
      user.savedListings = user.savedListings || [];
      user.savedListings.push(listingId);
      await user.save();
      return res.json({ message: "Đã lưu bài viết" });
    } else {
      // remove
      user.savedListings.splice(idx, 1);
      await user.save();
      return res.json({ message: "Đã bỏ lưu bài viết" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lấy danh sách tin đăng đã lưu của người dùng hiện tại
export const getSavedListings = async (req, res) => {
  try {
    console.log(req.userId); 
    const Id = req.userId;

    const user = await User.findById(Id).populate({
      path: "savedListings",
      options: { sort: { createdAt: -1 } },
    });
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    return res.json({
      message: "Lấy danh sách đã lưu thành công",
      listings: user.savedListings || [],
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    // --- JWT: Lấy userId từ req.userId ---
    // Lưu ý: searchUsers cần được bảo vệ bởi middleware verifyToken để có req.userId
    const currentUserId = req.userId;

    const query = req.query.q;
    if (!query) return res.json([]);

    // Tìm user theo tên, trừ bản thân mình ra
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: currentUserId },
    }).select("username name role");

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const { avatar } = req.body; // base64 hoặc url

    if (!avatar) {
      return res.status(400).json({ message: "Avatar is required" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Xóa avatar cũ trên cloudinary (nếu có)
    if (user.avatar) {
      const publicId = user.avatar.split("/").pop().split(".")[0];

      await cloudinary.uploader.destroy(`avatars/${publicId}`);
    }

    // Upload avatar mới
    const cloudinaryResponse = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "face" },
      ],
    });

    user.avatar = cloudinaryResponse.secure_url;
    await user.save();

    res.status(200).json({
      message: "Cập nhật avatar thành công",
      avatar: user.avatar,
    });
  } catch (error) {
    console.log("Error in changeAvatar controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      "username name phone email role avatar createdAt profile"
    );

    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    res.json({
      message: "Thông tin người dùng",
      user: user,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
