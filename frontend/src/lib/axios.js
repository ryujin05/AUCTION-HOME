import axios from "axios";
import { createStandaloneToast } from "@chakra-ui/react";

const { toast } = createStandaloneToast();

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? "https://real-estate-demo-backend-latest.onrender.com/api"
      : import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isHandlingUnauthorized = false;

// Hàm xóa token và dữ liệu người dùng
const clearAuthData = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key !== "chakra-ui-color-mode") {
      localStorage.removeItem(key);
    }
  });
  
  // Xóa cookies nếu có
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Xử lý khi token hết hạn hoặc không có quyền
    if (status === 401 || status === 403) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        
        // Xóa token và dữ liệu auth ngay lập tức
        clearAuthData();

        // Hiển thị toast
        if (!toast.isActive("session-expired")) {
          toast({
            id: "session-expired",
            title: status === 401 ? "Phiên đăng nhập đã hết hạn" : "Không có quyền truy cập",
            description: status === 401
              ? "Token của bạn đã hết hạn. Trang sẽ tự động tải lại sau 3 giây..."
              : "Bạn không có quyền thực hiện hành động này. Trang sẽ tự động tải lại sau 3 giây...",
            status: "error",
            duration: 3000,
            isClosable: false,
            position: "top",
            onCloseComplete: () => {
              window.location.reload();
            },
          });
        }

        // Tự động reload sau 3 giây
        setTimeout(() => {
          window.location.reload();
        }, 3000);

        // Reset flag
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 3500);
      }
    }

    return Promise.reject(error);
  }
);

export default api;