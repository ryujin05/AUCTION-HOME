import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuthContext } from "./AuthContext"; // Import hook từ file bạn vừa xong
import { useUserStore } from "../store/user";
import { createStandaloneToast } from "@chakra-ui/react";

const SocketContext = createContext();

// Hook để các component khác (ChatPage, ChatContainer) dùng socket
export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { currentUser } = useAuthContext(); // Lấy user hiện tại từ AuthContext

  useEffect(() => {
    // CHỈ KẾT NỐI KHI CÓ USER ĐĂNG NHẬP
    if (currentUser) {
      // 1. Khởi tạo kết nối
      // Lưu ý: Socket không đi qua Vite proxy nên tốt nhất trỏ thẳng localhost:5000
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://localhost:5000";
      const newSocket = io(SOCKET_URL, {
        withCredentials: true, // QUAN TRỌNG: Để gửi kèm Cookie Session xác thực
        query: {
            userId: currentUser._id // Gửi thêm ID để tiện debug hoặc xử lý ở server (tùy chọn)
        },
        transports: ["websocket", "polling"]
      });

      setSocket(newSocket);

      // Global: Listen for system notifications and show toast
      const { toast } = createStandaloneToast();
      newSocket.on("system_notification", (payload) => {
        toast({
          title: payload.title || "System Notification",
          description: payload.message,
          status: payload.type === "alert" ? "error" : payload.type === "warning" ? "warning" : "info",
          duration: 8000,
          isClosable: true,
          position: "top-right",
        });
      });

      // Forced logout from server (e.g., admin banned the account)
      const logoutUser = useUserStore.getState().logoutUser;
      newSocket.on("force_logout", async (payload) => {
        toast({
          title: "Đã bị khóa",
          description: payload?.message || "Tài khoản của bạn đã bị khóa",
          status: "error",
          duration: 8000,
          isClosable: true,
          position: "top-right",
        });

        try {
          // Call existing logout flow which clears cookie and resets state
          await logoutUser();
        } catch (e) {
          // best-effort: redirect to home
          window.location.href = "/";
        }
      });

      // Notify user when their listing status changes
      newSocket.on('listing_status_changed', (payload) => {
        toast({
          title: `Listing ${payload.status}`,
          description: `Listing ${payload.listingId} status: ${payload.status}`,
          status: payload.status === 'approved' ? 'success' : payload.status === 'rejected' ? 'error' : 'info',
          duration: 8000,
          isClosable: true,
          position: 'top-right',
        });
      });

      // (Tùy chọn) Lắng nghe các sự kiện global ở đây nếu muốn (ví dụ: danh sách online)
      // newSocket.on("getOnlineUsers", (users) => { ... });

      // 2. Cleanup: Ngắt kết nối khi component unmount hoặc user đăng xuất
      return () => { newSocket.close(); }
    } else {
      // Nếu không có user (đã logout), đóng socket nếu đang mở
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [currentUser]); // Chạy lại effect này mỗi khi currentUser thay đổi

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};