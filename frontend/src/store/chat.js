import { create } from "zustand";
import api from "../lib/axios.js";
import { useUserStore } from "./user.js";

export const useChatStore = create((set, get) => ({
  chats: [],
  // currentChat: null,
  selectedConversation: null,
  messages: [],
  loading: false,
  isMessagesLoading: false,
  error: null,

  createOrFindConversation: async (receiverId, initialMessage = null) => {
    try {
      // Gọi API POST /api/chats với participantIds theo đúng controller yêu cầu
      const res = await api.post("/chats", {
        participantIds: [receiverId],
        message: initialMessage,
      });

      // Lấy conversation từ object trả về của Backend { conversation: {...} }
      const conversation = res.data.conversation;

      // set({ currentChat: conversation });
      set({ selectedConversation: conversation });
      if (initialMessage && conversation.lastMessage) {
        try {
          const msgRes = await api.get(`/chats/${conversation._id}/messages`);
          const reversedMessages = msgRes.data.messages.reverse();

          set({
            messages: reversedMessages,
            isMessagesLoading: false,
          });
        } catch (e) {
          console.error("Lỗi fetch messages ngầm:", e);
        }
      } else {
        set({ messages: [], isMessagesLoading: false });
      }
      get().fetchChats();

      // return { success: true, conversationId: conversation._id };

      return { success: true, conversation: conversation };
    } catch (err) {
      console.error("Lỗi tạo/tìm hội thoại:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi kết nối",
      };
    }
  },

  // Lấy danh sách cuộc trò chuyện
  fetchChats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/chats"); // Dùng api.get
      set({ chats: res.data.conversations, loading: false });
    } catch (err) {
      console.log(err);
      set({ loading: false, error: "Failed to fetch chats" });
    }
  },

  // Chọn một cuộc trò chuyện
  // setCurrentChat: async (chat) => {
  //   set({ currentChat: chat, messages: [], loading: true });
  //   try {
  //     const res = await api.get(`/chats/${chat._id}/messages`);
  //     set({ messages: res.data.messages, loading: false });

  //     // Mark read ngay khi mở chat
  //     // (Có thể gọi ngầm không cần await để nhanh)
  //     api.put(`/chats/${chat._id}/read`);
  //   } catch (err) {
  //     console.log(err);
  //     set({ loading: false });
  //   }
  // },

  // --- 3. CHỌN CUỘC TRÒ CHUYỆN (VÀ LOAD TIN NHẮN) ---
  setSelectedConversation: async (conversation) => {
    // Nếu đang chọn đúng chat này rồi thì không load lại để tránh flicker (trừ khi tin nhắn rỗng)
    const currentSelected = get().selectedConversation;
    if (
      currentSelected?._id === conversation._id &&
      get().messages.length > 0
    ) {
      return;
    }

    set({
      selectedConversation: conversation,
      messages: [],
      isMessagesLoading: true,
    });

    try {
      const res = await api.get(`/chats/${conversation._id}/messages`);
      const reversedMessages = res.data.messages.reverse();
      set({ messages: reversedMessages, isMessagesLoading: false });

      // Đánh dấu đã đọc
      try {
        await api.put(`/chats/${conversation._id}/read`, {});
      } catch (readError) {
        console.warn("Lỗi mark read:", readError);
      }
    } catch (err) {
      console.log(err);
      set({ isMessagesLoading: false, error: "Failed to load messages" });
    }
  },

  // // Gửi tin nhắn
  // sendMessage: async (content, chatId) => {
  //   // Optimistic Update (Thêm tin nhắn vào list trước khi server trả về)
  //   const tempId = Date.now().toString();
  //   const tempMsg = {
  //     _id: tempId,
  //     content,
  //     sender: { _id: "me" }, // Giả định người gửi là mình
  //     createdAt: new Date().toISOString(),
  //     pending: true, // Cờ đánh dấu đang gửi
  //   };

  //   set((state) => ({ messages: [tempMsg, ...state.messages] }));

  //   try {
  //     const res = await api.post(`/chats/${chatId}/messages`, { content });

  //     // Server trả về tin nhắn thật -> Thay thế tin nhắn tạm
  //     set((state) => ({
  //       messages: state.messages.map((msg) =>
  //         msg._id === tempId ? res.data.data : msg
  //       ),
  //     }));

  //     // Update lại lastMessage trong danh sách chat (để chat nhảy lên đầu)
  //     get().fetchChats();
  //   } catch (err) {
  //     console.log(err);
  //     // Xóa tin nhắn tạm nếu lỗi (hoặc hiện nút thử lại)
  //     set((state) => ({
  //       messages: state.messages.filter((msg) => msg._id !== tempId),
  //     }));
  //   }
  // },
  // --- 4. GỬI TIN NHẮN ---
  sendMessage: async (content) => {
    const { selectedConversation, messages } = get();

    const currentUser = useUserStore.getState().user;

    if (!selectedConversation || !currentUser) return;

    // Optimistic Update: Hiển thị tin nhắn giả lập ngay lập tức
    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId,
      content,
      sender: { _id: currentUser._id || currentUser.id }, // ID giả định để UI hiển thị bên phải
      createdAt: new Date().toISOString(),
      pending: true,
    };

    set({ messages: [...messages, tempMsg] });

    try {
      const res = await api.post(
        `/chats/${selectedConversation._id}/messages`,
        { content }
      );
      const newRealMessage = res.data.data;

      // Thay thế tin nhắn tạm bằng tin nhắn thật từ server
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? newRealMessage : msg
        ),
      }));

      // Cập nhật lại lastMessage trong danh sách chats mà không cần fetch lại API
      set((state) => {
        const updatedChats = state.chats.map((c) => {
          if (c._id === selectedConversation._id) {
            return { ...c, lastMessage: newRealMessage };
          }
          return c;
        });
        // Đưa chat vừa nhắn lên đầu
        const chatIndex = updatedChats.findIndex(
          (c) => c._id === selectedConversation._id
        );
        if (chatIndex > -1) {
          const [movedChat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(movedChat);
        }
        return { chats: updatedChats };
      });
    } catch (err) {
      console.log(err);
      // Rollback: Xóa tin nhắn tạm nếu lỗi
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
    }
  },

  // Nhận tin nhắn từ Socket (Real-time)
  // addMessage: (message) => {
  //   const currentChat = get().currentChat;

  //   // Chỉ thêm nếu tin nhắn thuộc chat đang mở
  //   if (currentChat && message.conversation === currentChat._id) {
  //     set((state) => ({ messages: [message, ...state.messages] }));

  //     // Mark read ngay
  //     api.put(`/chats/${currentChat._id}/read`);
  //   }

  //   // Luôn reload danh sách chat để cập nhật lastMessage
  //   get().fetchChats();
  // },

  // --- 5. NHẬN TIN NHẮN TỪ SOCKET ---
  addMessage: (message) => {
    const { selectedConversation, messages } = get();

    const currentUser = useUserStore.getState().user;
    const currentUserId = currentUser?._id || currentUser?.id;

    const senderId =
      typeof message.sender === "object" ? message.sender._id : message.sender;
    if (senderId?.toString() === currentUserId?.toString()) {
      return;
    }

    // 1. Nếu tin nhắn thuộc cuộc hội thoại đang mở -> Thêm vào list messages
    if (
      selectedConversation &&
      message.conversation === selectedConversation._id
    ) {
      const isExist = messages.some((m) => m._id === message._id);
      if (!isExist) {
        set((state) => ({ messages: [...state.messages, message] }));
        // Mark read
        api.put(`/chats/${selectedConversation._id}/read`, {}).catch(() => {});
      }
    }

    // 2. Cập nhật danh sách Chat bên trái (Realtime update Last Message & Reorder)
    set((state) => {
      const updatedChats = state.chats.map((c) => {
        if (c._id === message.conversation) {
          return { ...c, lastMessage: message };
        }
        return c;
      });

      // Tìm và chuyển cuộc hội thoại có tin nhắn mới lên đầu
      const chatIndex = updatedChats.findIndex(
        (c) => c._id === message.conversation
      );
      if (chatIndex > -1) {
        const [movedChat] = updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(movedChat);
        return { chats: updatedChats };
      }

      // Trường hợp tin nhắn đến từ cuộc hội thoại mới tinh chưa có trong list (ít gặp nhưng có thể)
      if (chatIndex === -1) {
        // Tốt nhất là fetch lại để lấy full info người chat
        get().fetchChats();
      }

      return { chats: updatedChats };
    });
  },
}));
