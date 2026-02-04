import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import AdminAction from "../models/adminAction.model.js";
import Report from "../models/report.model.js";
import Announcement from "../models/announcement.model.js";
import { TEMPLATES } from "../utils/notificationTemplates.js";
import AnnouncementRead from "../models/announcementRead.model.js";
import SystemConfig from "../models/systemConfig.model.js";

export const createSystemAnnouncement = async (req, res) => {
  try {
    const { title, message, type, targetAudience, expiresAt } = req.body;

    // 1. Tạo bản ghi vào DB
    const newAnnouncement = await Announcement.create({
      title,
      message,
      type,
      targetAudience,
      expiresAt,
      createdBy: req.userId,
    });

    // 2. Bắn Socket cho TOÀN BỘ server
    if (req.io) {
      req.io.emit("system_notification", {
        _id: newAnnouncement._id,
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        type: "SYSTEM_ANNOUNCEMENT",
        createdAt: newAnnouncement.createdAt,
      });
    }

    // Audit log
    try {
      const adminAction = await AdminAction.create({
        admin: req.userId,
        action: "system_announcement",
        target: newAnnouncement._id, // Fix lỗi: listing._id -> newAnnouncement._id
        meta: { title, targetAudience }, // Fix lỗi: status, reason -> title, audience
      });
      console.log("AdminAction created: system_announcement", {
        id: adminAction._id,
        admin: req.userId,
      });
    } catch (e) {
      console.error("Error creating admin action: system_announcement", {
        admin: req.userId,
        target: newAnnouncement._id,
        meta: { title, targetAudience },
        error: e,
      });
    }

    return res.json({
      message: "Broadcast sent successfully",
      data: newAnnouncement,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createNotification = async (
  io,
  { recipient, type, title, message, reason, referenceId, referenceModel }
) => {
  try {
    const newNotif = await Notification.create({
      recipient,
      type,
      title,
      message,
      reason: reason || "",
      referenceId,
      referenceModel,
    });

    // Bắn socket tới room riêng của user (Real-time)
    if (io) {
      io.to(`user_${recipient}`).emit("new_notification", newNotif);
    }
    return newNotif;
  } catch (error) {
    console.error("Error creating notification:", {
      recipient,
      type,
      referenceId,
      referenceModel,
      error,
    });
    return null;
  }
};

export const getStats = async (req, res) => {
  try {
    // Totals
    const totalListings = await Listing.countDocuments();
    const totalUsers = await User.countDocuments();

    // Listing counts by status
    const listingStatusAgg = await Listing.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusCounts = listingStatusAgg.reduce((acc, cur) => {
      acc[cur._id || "unknown"] = cur.count;
      return acc;
    }, {});

    // Users signups last 7 days
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const usersAgg = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m-%d-%Y", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const usersLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = usersAgg.find((x) => x._id === key);
      usersLast7Days.push({ date: key, count: found ? found.count : 0 });
    }

    const propertyStatus = listingStatusAgg.map((d) => ({
      name: d._id || "unknown",
      value: d.count,
    }));

    return res.json({
      totals: { totalListings, totalUsers },
      usersLast7Days,
      propertyStatus,
      statusCounts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = await SystemConfig.create({});
    return res.json({ config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateSystemConfig = async (req, res) => {
  try {
    const {
      commissionRate,
      defaultDepositAmount,
      antiSnipingWindowSec,
      antiSnipingExtensionSec,
    } = req.body;

    let config = await SystemConfig.findOne();
    if (!config) config = await SystemConfig.create({});

    if (commissionRate !== undefined) config.commissionRate = Number(commissionRate);
    if (defaultDepositAmount !== undefined)
      config.defaultDepositAmount = Number(defaultDepositAmount);
    if (antiSnipingWindowSec !== undefined)
      config.antiSnipingWindowSec = Number(antiSnipingWindowSec);
    if (antiSnipingExtensionSec !== undefined)
      config.antiSnipingExtensionSec = Number(antiSnipingExtensionSec);

    await config.save();
    return res.json({ message: "Config updated", config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllListings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(200, parseInt(req.query.limit || "50"));
    const skip = (page - 1) * limit;

    // Filters: status, rental_type, auctionStatus
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.rental_type) query.rental_type = req.query.rental_type;
    if (req.query.auctionStatus) query.auctionStatus = req.query.auctionStatus;
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate("owner", "name username profile email")
        .populate("property_type", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit);
    return res.json({ listings, total, page, pages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateListingStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status, reason } = req.body;

    console.log("updateListingStatus called", {
      admin: req.userId,
      listingId: id,
      status,
      reason,
      ip: req.ip,
    });

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    listing.status = status;
    if (status === "rejected") listing.rejectionReason = reason;
    await listing.save();

    if (listing.owner) {
      if (status === "approved") {
        // [Template] Post Approved
        const tpl = TEMPLATES.POST_APPROVED(listing.title);
        await createNotification(req.io, {
          recipient: listing.owner,
          type: "POST_APPROVED",
          title: tpl.title,
          message: tpl.message,
          referenceId: listing._id,
          referenceModel: "Listing",
        });
      } else if (status === "rejected") {
        // [Template] Post Rejected
        const tpl = TEMPLATES.POST_REJECTED(listing.title);
        await createNotification(req.io, {
          recipient: listing.owner,
          type: "POST_REJECTED",
          title: tpl.title,
          message: tpl.message,
          reason: reason, // Lý do admin nhập
          referenceId: listing._id,
          referenceModel: "Listing",
        });
      }
    }

    // Audit
    try {
      const adminAction = await AdminAction.create({
        admin: req.userId,
        action: "update_listing_status",
        target: listing._id,
        meta: { status, reason },
      });
      console.log("AdminAction created: update_listing_status", {
        id: adminAction._id,
        admin: req.userId,
      });
    } catch (e) {
      console.error("Error creating admin action: update_listing_status", {
        admin: req.userId,
        target: listing._id,
        meta: { status, reason },
        error: e,
      });
    }

    return res.json({ message: "Listing status updated", listing });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(200, parseInt(req.query.limit || "50"));
    const skip = (page - 1) * limit;

    const query = {};
    // Include email and phone for admin view
    const [users, total] = await Promise.all([
      User.find(query)
        .select("username name role createdAt isBanned email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit);
    return res.json({ users, total, page, pages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin actions (audit log)
export const getAdminActions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(200, parseInt(req.query.limit || "50"));
    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      AdminAction.find()
        .populate("admin", "username name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminAction.countDocuments(),
    ]);

    return res.json({ actions, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Aggregation: user signups last 7 days
export const getUserSignupsLast7Days = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build array for last 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = data.find((x) => x._id === key);
      result.push({ date: key, count: found ? found.count : 0 });
    }

    return res.json({ data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Aggregation: properties count by status
export const getPropertyStatusDistribution = async (req, res) => {
  try {
    const data = await Listing.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const result = data.map((d) => ({
      name: d._id || "unknown",
      value: d.count,
    }));
    return res.json({ data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Aggregation: listings created in last 7 days
export const getListingsLast7Days = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const data = await Listing.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = data.find((x) => x._id === key);
      result.push({ date: key, count: found ? found.count : 0 });
    }

    return res.json({ data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: delete any listing by id
export const deleteListingAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.owner) {
      await createNotification(req.io, {
        recipient: listing.owner,
        type: "POST_DELETED",
        title: "Bài viết bị xóa bởi quản trị viên",
        message: `Bài đăng "${listing.title}" đã bị xóa khỏi hệ thống.`,
        reason: reason || "Vi phạm điều khoản nghiêm trọng",
        // Lưu ý: referenceId trỏ vào bài đã xóa thì khi click vào sẽ báo lỗi 404,
        // frontend cần xử lý hiển thị text tĩnh nếu không fetch được bài
        referenceId: listing._id,
        referenceModel: "Listing",
      });
    }
    // delete cloudinary images if present
    try {
      const cloudinary = (await import("../config/cloudinary.js")).default;
      await Promise.all(
        (listing.images || []).map(async (img) => {
          if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
        })
      );
    } catch (e) {
      console.error("Error deleting images", e);
    }

    await Listing.findByIdAndDelete(id);

    try {
      const adminAction = await AdminAction.create({
        admin: req.userId,
        action: "delete_listing",
        target: id,
        meta: { reason },
      });
      console.log("AdminAction created: delete_listing", {
        id: adminAction._id,
        admin: req.userId,
      });
    } catch (e) {
      console.error("Error creating admin action: delete_listing", {
        admin: req.userId,
        target: id,
        meta: { reason },
        error: e,
      });
    }

    return res.json({ message: "Listing deleted by admin" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(200, parseInt(req.query.limit || "50"));
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find()
        .populate("reporter", "username name")
        .populate({
          path: "listing",
          select: "title owner",
          populate: {
            path: "owner",
            select: "name profile createdAt",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(),
    ]);

    const pages = Math.ceil(total / limit);
    return res.json({ reports, total, page, pages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Resolve a report (mark status)
export const resolveReport = async (req, res) => {
  try {
    const id = req.params.id;
    const r = await Report.findById(id);
    if (!r) return res.status(404).json({ message: "Report not found" });

    // Notify reporter that report is closed (optional)
    if (r.reporter) {
      await createNotification(req.io, {
        recipient: r.reporter,
        type: "REPORT_RESOLVED",
        title: "Báo cáo đã đóng",
        message: "Báo cáo của bạn đã được xem xét và đóng lại.",
        referenceId: r._id, // report id (đã xóa thì chỉ lưu text)
        referenceModel: "Report",
      });
    }
    await Report.findByIdAndDelete(id);
    try {
      const adminAction = await AdminAction.create({
        admin: req.userId,
        action: "delete_report",
        target: id,
        meta: {},
      });
      console.log("AdminAction created: delete_report", {
        id: adminAction._id,
        admin: req.userId,
      });
    } catch (e) {
      console.error("Error creating admin action: delete_report", {
        admin: req.userId,
        target: id,
        meta: {},
        error: e,
      });
    }
    return res.json({ message: "Report deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Take action on a report: delete listing or ban owner
export const actionOnReport = async (req, res) => {
  try {
    const id = req.params.id;
    const { action, reason } = req.body;

    const r = await Report.findById(id).populate("listing");
    if (!r) return res.status(404).json({ message: "Report not found" });

    // Nếu listing đã mất → auto resolve + delete report
    if ((action === "delete_listing" || action === "ban_user") && !r.listing) {
      try {
        const adminAction = await AdminAction.create({
          admin: req.userId,
          action: "resolve_report_missing_listing",
          target: r._id,
          meta: {},
        });
        console.log("AdminAction created: resolve_report_missing_listing", {
          id: adminAction._id,
          admin: req.userId,
        });
      } catch (e) {
        console.error(
          "Error creating admin action: resolve_report_missing_listing",
          { admin: req.userId, target: r._id, meta: {}, error: e }
        );
      }

      await Report.findByIdAndDelete(r._id);

      return res.json({
        message: "Bài viết gốc không còn tồn tại. Báo cáo đã được xóa.",
      });
    }

    // ================= DELETE LISTING =================
    if (action === "delete_listing") {
      const listing = await Listing.findById(r.listing._id);

      if (listing) {
        // Thông báo cho chủ bài đăng (người bị report)
        if (listing.owner) {
          await createNotification(req.io, {
            recipient: listing.owner,
            type: "POST_DELETED",
            title: "Bài viết bị xóa do vi phạm",
            message: `Bài đăng "${listing.title}" bị xóa sau khi nhận báo cáo vi phạm.`,
            reason: reason || "Nội dung không phù hợp quy chuẩn cộng đồng.",
            referenceId: listing._id,
            referenceModel: "Listing",
          });
        }

        try {
          const cloudinary = (await import("../config/cloudinary.js")).default;
          await Promise.all(
            (listing.images || []).map((img) =>
              img.public_id ? cloudinary.uploader.destroy(img.public_id) : null
            )
          );
        } catch (e) {
          console.error("Image delete failed", e);
        }

        await Listing.findByIdAndDelete(listing._id);
      }

      //Thông báo kết quả cho người Report (người đi report)
      if (r.reporter) {
        await createNotification(req.io, {
          recipient: r.reporter,
          type: "REPORT_RESOLVED",
          title: "Báo cáo đã được xử lý",
          message: `Cảm ơn bạn đã báo cáo bài đăng "${r.listing.title}". Chúng tôi đã xóa bài viết vi phạm này.`,
          referenceId: null, // Vì report bị xóa
          referenceModel: "Report",
        });
      }

      await Report.findByIdAndDelete(r._id);

      return res.json({ message: "Listing deleted and report removed" });
    }

    // ================= BAN USER =================
    if (action === "ban_user") {
      const listing = await Listing.findById(r.listing._id);

      if (listing) {
        const owner = await User.findById(listing.owner);
        if (owner) {
          owner.isBanned = true;
          await owner.save();

          // Thông báo cho người bị Ban (trước khi logout)
          // Tạo thông báo DB để khi họ tìm cách login lại hoặc check email sẽ thấy lý do
          await createNotification(req.io, {
            recipient: owner._id,
            type: "USER_BANNED",
            title: "Tài khoản bị khóa",
            message: "Tài khoản của bạn đã bị khóa do vi phạm nghiêm trọng.",
            reason: reason || "Bị nhiều người dùng báo cáo vi phạm.",
            referenceId: null,
            referenceModel: "User",
          });

          try {
            req.io?.in(`user_${owner._id}`).emit("force_logout", {
              message: `Tài khoản bị khóa. Lý do: ${
                reason || "Vi phạm chính sách"
              }`,
            });

            if (
              req.io?.in &&
              typeof req.io.in(`user_${owner._id}`).disconnectSockets ===
                "function"
            ) {
              await req.io.in(`user_${owner._id}`).disconnectSockets();
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      // C. Thông báo cảm ơn người Report
      if (r.reporter) {
        await createNotification(req.io, {
          recipient: r.reporter,
          type: "REPORT_RESOLVED",
          title: "Báo cáo đã được xử lý",
          message: `Cảm ơn bạn đã báo cáo. Chúng tôi đã khóa tài khoản vi phạm.`,
          referenceId: null,
          referenceModel: "Report",
        });
      }

      await Report.findByIdAndDelete(r._id);

      return res.json({ message: "User banned and report removed" });
    }

    // ================= IGNORE =================
    // 4. IGNORE (Bỏ qua báo cáo)
    // Thông báo cho người report là "Không vi phạm"
    if (r.reporter) {
      await createNotification(req.io, {
        recipient: r.reporter,
        type: "REPORT_RESOLVED",
        title: "Kết quả xử lý báo cáo",
        message: `Chúng tôi đã xem xét báo cáo của bạn về bài đăng "${r.listing?.title}". Hiện tại bài đăng chưa vi phạm tiêu chuẩn cộng đồng.`,
        referenceId: null,
        referenceModel: "Report",
      });
    }

    await Report.findByIdAndDelete(r._id);

    return res.json({ message: "Report ignored and removed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const toggleBanUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { ban, reason } = req.body; // boolean + reason

    console.log("toggleBanUser called", {
      admin: req.userId,
      targetUserId: id,
      body: req.body,
      ip: req.ip,
    });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = !!ban;
    await user.save();

    // Thông báo + Lý do
    if (user.isBanned) {
      await createNotification(req.io, {
        recipient: user._id,
        type: "USER_BANNED",
        title: "Tài khoản bị khóa",
        message: "Quyền truy cập của bạn đã bị vô hiệu hóa.",
        reason: reason || "Vi phạm điều khoản sử dụng.",
        referenceId: null,
        referenceModel: "User",
      });

      // Force logout
      try {
        const room = `user_${user._id}`;
        req.io?.in(room).emit("force_logout", {
          message: `Tài khoản đã bị khóa. Lý do: ${
            reason || "Quản trị viên khóa"
          }`,
        });
        if (
          req.io?.in &&
          typeof req.io.in(room).disconnectSockets === "function"
        ) {
          await req.io.in(room).disconnectSockets();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Nếu mở khóa (Unban), cũng nên báo 1 tiếng cho lịch sự
      await createNotification(req.io, {
        recipient: user._id,
        type: "USER_BANNED", // Có thể dùng type khác như USER_RESTORED nếu muốn
        title: "Tài khoản được khôi phục",
        message: "Tài khoản của bạn đã được mở khóa. Chào mừng quay lại!",
        reason: "",
        referenceId: null,
        referenceModel: "User",
      });
    }

    // Audit
    try {
      const adminAction = await AdminAction.create({
        admin: req.userId,
        action: "toggle_ban_user",
        target: user._id,
        meta: { ban: user.isBanned, reason },
      });
      console.log("AdminAction created: toggle_ban_user", {
        id: adminAction._id,
        admin: req.userId,
      });
    } catch (e) {
      console.error("Error creating admin action: toggle_ban_user", {
        admin: req.userId,
        target: user._id,
        meta: { ban: user.isBanned, reason },
        error: e,
      });
    }

    return res.json({ message: "User updated", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const broadcastSystemNotification = async (req, res) => {
  try {
    const { title, message, type = "info", audience = "all" } = req.body;
    if (!message || !title)
      return res.status(400).json({ message: "Missing title or message" });

    let user;
    if (audience !== "all") {
      user = await User.findOne({
        $or: [{ email: audience }, { username: audience }],
      });
    }

    // 1. Persist notification
    let notif, announce;
    try {
      // notif = await Notification.create({ title, message, type, audience });
      announce = await Announcement.create({
        title,
        message,
        type,
        audience,
        createdBy: req.userId,
      });
    } catch (error) {
      console.error("Error creating broadcast notification", {
        admin: req.userId,
        payload: { title, message, type, audience },
        error: error,
      });
      return res
        .status(500)
        .json({ message: "Failed to save broadcast notification" });
    }

    let announceRead;

    if (user) {
      try {
        announceRead = await AnnouncementRead.create({
          userId: user._id,
          announcementId: announce._id,
          isRead: false,
        });
      } catch (error) {
        console.error("Error creating Announcement Read", {
          admin: req.userId,
          payload: { title, message, type, audience },
          error: error,
        });
        return res
          .status(500)
          .json({ message: "Failed to save announcement read" });
      }
    }

    // 2. Emit event to connected sockets
    if (audience === "all") {
      req.io?.emit("system_notification", {
        id: announce._id,
        title,
        message,
        type,
        audience,
        createdAt: announce.createdAt,
      });
    } else if (typeof audience === "string" && audience.startsWith("user:")) {
      const userId = audience.split(":")[1];
      req.io?.in(`user_${userId}`)?.emit("system_notification", {
        id: announce._id,
        title,
        message,
        type,
        audience,
        createdAt: announce.createdAt,
      });
    } else if (typeof audience === "string" && audience.startsWith("email:")) {
      const email = audience.split(":")[1];
      // Find user by email and emit to their room if found
      try {
        const u = await User.findOne({ email });
        if (u)
          req.io?.in(`user_${u._id}`)?.emit("system_notification", {
            id: announce._id,
            title,
            message,
            type,
            audience,
            createdAt: announce.createdAt,
          });
      } catch (e) {
        console.error("Failed to find user by email for broadcast", e);
      }
    } else {
      // Fallback: emit to all
      req.io?.emit("system_notification", {
        id: announce._id,
        title,
        message,
        type,
        audience,
        createdAt: announce.createdAt,
      });
    }

    // Audit
    try {
      const adminAction = await AdminAction.create({
        admin: req.userId,
        action: "broadcast",
        target: announce._id,
        meta: { title, message, type, audience },
      });
      console.log("AdminAction created: broadcast", {
        id: adminAction._id,
        admin: req.userId,
      });
    } catch (e) {
      console.error("Error creating admin action: broadcast", {
        admin: req.userId,
        target: announce._id,
        meta: { title, message, type, audience },
        error: e,
      });
    }

    return res.json({
      message: "Broadcast saved and sent",
      announcement: announce,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const items = await Notification.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ notifications: items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const announces = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ announcements: announces });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
