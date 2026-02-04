import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    let title = "Nền tảng Bất động sản uy tín"; // Mặc định

    if (path === "/") title = "Trang chủ - Real Estate";
    else if (path === "/listings") title = "Danh sách nhà đất - Real Estate";
    else if (path.startsWith("/listings/"))
      title =
        "Chi tiết bất động sản"; // Sẽ hay hơn nếu dùng dữ liệu động sau này
    else if (path === "/my-posts") title = "Bài đăng của tôi";
    else if (path === "/saved-posts") title = "Tin đã lưu";
    else if (path === "/chat") title = "Tin nhắn";
    else if (path === "/profile") title = "Trang cá nhân";
    else if (path.startsWith("/admin")) title = "Quản trị hệ thống - Admin";

    if (!path.startsWith("/listings/")) {
      document.title = title;
    }
  }, [location]);

  return null;
};

export default PageTitle;
