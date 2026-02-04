import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/axios"; 

const AuthContext = createContext();

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm cập nhật state (dùng khi Login/Logout thành công)
  const updateUser = (data) => {
    setCurrentUser(data);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // --- SỬA QUAN TRỌNG: Gọi đúng endpoint check-auth của JWT ---
        // Endpoint này được định nghĩa trong server.js
        const res = await api.get("/check-auth"); 
        
        if (res.data.user) {
          setCurrentUser(res.data.user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        // Lỗi 401 hoặc lỗi mạng -> Coi như chưa đăng nhập
        console.log("Auth check failed:", err.message); 
        setCurrentUser(null);
      } finally {
        setIsLoading(false); // Luôn tắt loading dù thành công hay thất bại
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};