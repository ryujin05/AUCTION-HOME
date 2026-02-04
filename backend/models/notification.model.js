import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required to support system-wide notifications (audience-based)
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Audience for system notifications (e.g., 'all', 'admins', 'users', 'user:<id>', 'email:<address>')
    audience: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        "POST_APPROVED",
        "POST_REJECTED",
        "POST_DELETED",
        "USER_BANNED",
        "REPORT_RESOLVED",
        "info",
      ],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    referenceModel: {
      type: String,
      enum: ['Listing', 'Report', 'User'],
    },
    title: {
      type: String,
      required: true
    },
    message: { type: String },
    reason: {
      type: String,
      default: ""
    },
    isRead: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export const markAnnouncementAsRead = async (req, res) => {
    try {
        const { id } = req.params; // ID của Announcement
        const userId = req.userId;

        await AnnouncementRead.create({
            userId,
            announcementId: id
        });

        return res.json({ success: true });
    } catch (e) {
        // Nếu duplicate key (đã đọc rồi) thì thôi, ko báo lỗi
        return res.json({ success: true });
    }
}

export default Notification;
