import express from "express";
import {
  createList,
  getListings,
  deleteListing,
  getMyListings,
  getUserListings,
  updateListing,
  getListingById,
  searchListings,
  updateListingStatus,
  getListingBids,
  placeBid,
  getMyBids,
  cancelAuction
} from "../controllers/listing.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; // <--- QUAN TRỌNG: Import middleware
 
const router = express.Router();
 
// --- 1. PUBLIC ROUTES (Ai cũng xem được) ---
// Phải đặt lên trên cùng để tránh bị nhầm với /:id
router.get("/search", searchListings); // Tìm kiếm
router.get("/getList", getListings);   // Lấy danh sách (filter)
router.get("/user/:userId", getUserListings); // Lấy bài đăng của user
router.get("/:id/bids", verifyToken, getListingBids); // Lấy lịch sử đấu giá (owner/admin)
 
// --- 2. PROTECTED ROUTES (Cần đăng nhập) ---
// Áp dụng verifyToken để controller có thể lấy req.userId
router.post("/createList", verifyToken, createList);
router.get("/my", verifyToken, getMyListings);
router.get("/my-bids", verifyToken, getMyBids);
router.delete("/delete/:id", verifyToken, deleteListing);
router.put("/:id", verifyToken, updateListing); // Update tin đăng
router.put("/:id/status", verifyToken, updateListingStatus);
router.post("/:id/bids", verifyToken, placeBid); // Đặt giá
router.post("/:id/cancel", verifyToken, cancelAuction);
 
// --- 3. DYNAMIC PUBLIC ROUTE (Đặt cuối cùng) ---
// Route này "hút" tất cả các request GET còn lại vào ID
router.get("/:id", getListingById);
 
export default router;
 