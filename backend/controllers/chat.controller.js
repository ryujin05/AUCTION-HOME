import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

// POST /api/chats
export const createConversation = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const { participantIds = [], title, type = "private", message } = req.body;

    // Đảm bảo không trùng lặp ID và ép kiểu về String để so sánh chuẩn
    const uniqueIds = new Set([currentUserId, ...participantIds]);
    const participants = Array.from(uniqueIds);

    let conversation = null;
    let isNew = false;

    // Kiểm tra xem đã có conversation giữa các participants này chưa
    if (type === "private" && participants.length === 2) {
      conversation = await Conversation.findOne({
        type: "private",
        participants: { $all: participants, $size: 2 },
      }).populate("participants", "username name profile");
    }

    if (!conversation) {
      conversation = await Conversation.create({
        title: title || null,
        participants,
        type,
      });
      isNew = true;
    }

    //   if (existingConv) {
    //     return res.json({
    //       message: "Found existing conversation",
    //       conversation: existingConv,
    //     });
    //   }
    // }

    // const conv = await Conversation.create({
    //   title: title || null,
    //   participants,
    //   type,
    // });

    // await conv.populate("participants", "username name profile");

    // return res.status(201).json({
    //   message: "Created",
    //   conversation: conv,
    // });

    // 2. Xử lý gửi tin nhắn tự động (Nếu có 'message' trong body)
    if (message && message.trim().length > 0) {
      // Tạo tin nhắn
      const newMessage = await Message.create({
        conversation: conversation._id,
        sender: currentUserId,
        content: message,
        type: "text",
        readBy: [currentUserId],
      });

      // Populate sender để trả về cho socket/client đẹp hơn
      await newMessage.populate("sender", "username name profile");

      // Cập nhật lastMessage cho Conversation
      conversation.lastMessage = newMessage._id;
      conversation.updatedAt = new Date(); // Đẩy hội thoại lên đầu
      await conversation.save();

      // Gửi Socket realtime (nếu có cấu hình)
      if (req.io) {
        req.io.to(conversation._id.toString()).emit("new_message", newMessage);
      }
    }

    // 3. Populate và trả về kết quả
    // Cần populate lại để đảm bảo đầy đủ thông tin (đặc biệt là lastMessage vừa update)
    await conversation.populate("participants", "username name profile");
    await conversation.populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username name profile" },
    });

    return res.status(isNew ? 201 : 200).json({
      message: isNew
        ? "Created new conversation"
        : "Found existing conversation",
      conversation: conversation,
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/chats -> list conversations for current user
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const { page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const convs = await Conversation.find({ participants: currentUserId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("participants", "username name profile")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username name profile" },
      });

    return res.json({
      message: "OK",
      conversations: convs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/chats/:id/message
export const getMessages = async (req, res) => {
  try {
    const convId = req.params.id;
    const { page = 1, limit = 30, before } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const query = { conversation: convId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "username name profile");

    return res.json({
      message: "OK",
      messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/chats/:id/read
export const markMessagesRead = async (req, res) => {
  try {
    const currentUserId = req.userId; 

    const convId = req.params.id;
    const { messageIds } = req.body;
    const filter = { conversation: convId };

    if (Array.isArray(messageIds) && messageIds.length) {
      filter._id = { $in: messageIds };
    }

    // Chỉ update những tin chưa được user này đọc
    filter.readBy = { $ne: currentUserId };

    const result = await Message.updateMany(filter, {
      $addToSet: { readBy: currentUserId },
    });

    return res.json({
      message: "Marked read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/chats/:id/participants
export const addParticipant = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const convId = req.params.id;
    const { participantId } = req.body;

    const conv = await Conversation.findById(convId);
    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Convert ObjectId sang String để so sánh chính xác
    const isMember = conv.participants.some(
      (id) => id.toString() === currentUserId
    );
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const isAlreadyAdded = conv.participants.some(
      (id) => id.toString() === participantId.toString()
    );

    if (!isAlreadyAdded) {
      conv.participants.push(participantId);
      await conv.save();
    }

    await conv.populate("participants", "username name profile");

    return res.json({
      message: "Participant added",
      conversation: conv,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/chats/:id/messages
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.userId; 

    const convId = req.params.id;
    const { content, type = "text" } = req.body;

    // 1. Tạo tin nhắn mới
    const newMessage = await Message.create({
      conversation: convId,
      sender: currentUserId, // ✅ Dùng biến này thay vì user.id
      content,
      type,
      readBy: [currentUserId],
    });

    // 2. Populate thông tin người gửi
    await newMessage.populate("sender", "username name profile");

    // 3. Cập nhật lastMessage và updatedAt cho Conversation
    await Conversation.findByIdAndUpdate(convId, {
      lastMessage: newMessage._id,
      updatedAt: new Date(),
    });

    // 4. Real-time Socket
    if (req.io) {
      req.io.to(convId).emit("new_message", newMessage);
    } else {
      console.warn("Socket.io (req.io) is undefined. Realtime update skipped.");
    }

    return res.status(201).json({
      message: "Sent",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
