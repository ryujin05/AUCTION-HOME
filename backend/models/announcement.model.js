// models/announcement.model.js
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['info', 'warning', 'error', 'success'], 
      default: 'info' 
    },
    // Đối tượng nhận: 'all', 'agent', 'user' (để filter hiển thị phía client)
    targetAudience: { 
      type: String, 
      enum: ['all', 'agents', 'users'], 
      default: 'all' 
    },
    // Ngày hết hạn (VD: thông báo bảo trì xong thì ko cần hiện nữa)
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;