import express from "express";
import {
  deleteUser,
  getUserInfor,
  loginUser,
  logoutUser,
  updateUserInfo,
  userRegister,
  resendVerification,
  verifyEmail,
  sendResetCode,
  resetPasswordWithCode,
  toggleSaveListing,
  getSavedListings,
  searchUsers,
  loginGoogle,
  changeAvatar,
  getUserById,
  requestChangePassword,
  verifyAndChangeCurrentPassword,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; 

const router = express.Router();

// --- 1. ROUTES CÔNG KHAI (Không cần đăng nhập) ---
router.post("/register", userRegister);
router.post("/login", loginUser);
router.post("/login-google", loginGoogle);
router.post("/logout", logoutUser); 
router.post('/resend-verification', resendVerification);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password-code', sendResetCode);
router.post('/reset-password-code', resetPasswordWithCode);


// Route yêu cầu đổi pass (Gửi current pass -> nhận code)
router.post("/request-change-password", verifyToken, requestChangePassword);

// Route xác nhận đổi pass (Gửi code + new pass -> xong)
router.post("/confirm-change-password", verifyToken, verifyAndChangeCurrentPassword);

router.get("/profile", verifyToken , getUserInfor);
router.put("/update", verifyToken, updateUserInfo);
router.delete("/deleteUser/:id", verifyToken, deleteUser);
router.get("/saved", verifyToken, getSavedListings);
router.post("/save/:listingId", verifyToken, toggleSaveListing);
router.get("/search", verifyToken, searchUsers); 
router.put("/avatar", verifyToken, changeAvatar);

router.get("/:id", getUserById);

export default router;
