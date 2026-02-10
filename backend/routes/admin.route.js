import express from "express";
import {
  getStats,
  getAllListings,
  updateListingStatus,
  getUserSignupsLast7Days,
  getPropertyStatusDistribution,
  getListingsLast7Days,
  getAllUsers,
  toggleBanUser,
  broadcastSystemNotification,
  createSystemAnnouncement,
  getNotifications,
  deleteListingAdmin,
  getReports,
  resolveReport,
  actionOnReport,
  getAdminActions,
  getAnnouncements,
  getSystemConfig,
  updateSystemConfig,
  getPricePrediction,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { adminLimiter } from "../middleware/rateLimiter.js";
import { validateBroadcast, validateStatusUpdate, validateToggleBan } from "../middleware/adminValidation.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken, verifyAdmin, adminLimiter);

router.get("/stats", getStats);
router.get("/system-config", getSystemConfig);
router.put("/system-config", updateSystemConfig);
router.get("/listings", getAllListings);
router.get("/stats/users-7days", getUserSignupsLast7Days);
router.get("/stats/properties-status", getPropertyStatusDistribution);
router.get("/stats/listings-7days", getListingsLast7Days);
router.put("/listings/:id/status", validateStatusUpdate, updateListingStatus);
router.delete("/listings/:id", deleteListingAdmin);

router.get("/users", getAllUsers);
router.put("/users/:id/ban", validateToggleBan, toggleBanUser);

router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.post('/reports/:id/action', actionOnReport);

router.get('/actions', getAdminActions);

router.post("/broadcast", validateBroadcast, broadcastSystemNotification);
router.get("/notifications", getNotifications);
router.get("/announcements", getAnnouncements);
router.get("/price-prediction", getPricePrediction);

export default router;
