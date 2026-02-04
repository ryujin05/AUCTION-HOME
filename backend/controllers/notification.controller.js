import Notification from "../models/notification.model.js";
import Announcement from "../models/announcement.model.js";
import AnnouncementRead from "../models/announcementRead.model.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const unreadAnnounce = await AnnouncementRead.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    const unreadNotif = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    const unreadCount = unreadAnnounce + unreadNotif;

    let systemNotifs = [];
    if (page == 1) {
      systemNotifs = await Announcement.find({
        $or: [
          { expiresAt: { $exists: false } }, // Không có hạn
          { expiresAt: { $gt: new Date() } }, // Hoặc chưa hết hạn
        ],
        // Nếu user là 'user' thường thì không lấy cái của 'agent'
        targetAudience: { $in: ["all", req.userRole] },
      })
        .sort({ createdAt: -1 })
        .limit(3);
    }
    // 1. Lấy thông báo cá nhân (Của riêng tôi)
    const personalNotifs = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 3. (Optional) Kiểm tra xem user đã đọc thông báo toàn hệ thống nào chưa
    // Lấy danh sách ID các thông báo global đã đọc
    const readGlobalIds = await AnnouncementRead.find({ userId })
      .select("announcementId")
      .distinct("announcementId"); // Trả về mảng [id1, id2...]

    // Map lại globalNotifs để thêm cờ isRead
    const formattedSystem = systemNotifs.map((n) => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: "SYSTEM_ANNOUNCEMENT",
      createdAt: n.createdAt,
      isRead: false,
    }));

    const notifications = [...formattedSystem, ...personalNotifs];

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      notifications,
      totalUnread: unreadCount,
      hasMore: personalNotifs.length === limit, // Nếu lấy đủ limit tức là có thể còn trang sau
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm thông báo cá nhân và update
    const notif = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.userId },
      { isRead: true },
      { new: true }
    );

    // Nếu không tìm thấy trong Notification, có thể đó là Announcement
    const announce = await AnnouncementRead.findOneAndUpdate(
      { _id: id },
      { isRead: true },
      { userId: req.userId }
    );

    return res.json({
      success: true,
      notification: notif,
      announcement: announce,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Đánh dấu tất cả là đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );
    await AnnouncementRead.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
