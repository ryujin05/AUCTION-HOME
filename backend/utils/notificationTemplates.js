// utils/notificationTemplates.js

export const TEMPLATES = {
  POST_APPROVED: (title) => ({
    title: "Bài viết được duyệt",
    message: "Bài viết của bạn đã được hiển thị công khai."
  }),
  POST_REJECTED: (title) => ({
    title: "Bài viết bị từ chối",
    message: `Bài viết "${title}" bị từ chối.` // Logic phía sau sẽ ghép thêm Reason
  }),
  POST_DELETED: (title) => ({
    title: "Bài viết đã bị xóa",
    message: `Bài viết "${title}" đã bị xóa bởi quản trị viên.` // Ghép thêm Reason
  }),
  USER_BANNED: () => ({
    title: "Tài khoản bị khóa",
    message: "Tài khoản của bạn đã bị khóa." // Ghép thêm Reason
  }),
  REPORT_RESOLVED_DELETE: (listingTitle) => ({
    title: "Xử lý báo cáo",
    message: `Báo cáo của bạn về bài viết "${listingTitle}" đã được xử lý. Kết quả: Chúng tôi đã xóa bài viết vi phạm.`
  }),
  REPORT_RESOLVED_BAN: (listingTitle) => ({
    title: "Xử lý báo cáo",
    message: `Báo cáo của bạn về bài viết "${listingTitle}" đã được xử lý. Kết quả: Tài khoản vi phạm đã bị khóa.`
  }),
  REPORT_RESOLVED_KEEP: (listingTitle) => ({
    title: "Xử lý báo cáo",
    message: `Báo cáo của bạn về bài viết "${listingTitle}" đã được xử lý. Kết quả: Bài viết không vi phạm.`
  })
};