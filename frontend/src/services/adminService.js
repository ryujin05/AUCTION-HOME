import api from "../lib/axios";

const adminService = {
  getStats: () => api.get("/admin/stats"),
  getSystemConfig: () => api.get("/admin/system-config"),
  updateSystemConfig: (payload) => api.put("/admin/system-config", payload),
  getListings: (params = {}) => api.get("/admin/listings", { params }),
  updateListingStatus: (id, status, reason) =>
    api.put(`/admin/listings/${id}/status`, { status, reason }),
  getUsers: () => api.get("/admin/users"),
  toggleBanUser: (id, ban, reason) => api.put(`/admin/users/${id}/ban`, { ban, reason }),
  broadcast: (title, message, type = "info", audience = "all", expiresAt = null) =>
    api.post("/admin/broadcast", { title, message, type, targetAudience: audience, expiresAt }),
  getNotifications: () => api.get("/admin/notifications"),
  getAnnouncements: () => api.get("/admin/announcements"),
  getUserSignupsLast7Days: () => api.get("/admin/stats/users-7days"),
  getPropertyStatusDistribution: () =>
    api.get("/admin/stats/properties-status"),
  getListingsLast7Days: () => api.get("/admin/stats/listings-7days"),
  deleteListing: (id, reason) => api.delete(`/admin/listings/${id}`, {data: {reason}}),
  getReports: (page = 1, limit = 50) =>
    api.get(`/admin/reports?page=${page}&limit=${limit}`),
  resolveReport: (id, status) =>
    api.put(`/admin/reports/${id}/resolve`, { status }),
  actionOnReport: (id, action, reason) =>
    api.post(`/admin/reports/${id}/action`, { action, reason }),
  getAdminActions: (page = 1, limit = 50) =>
    api.get(`/admin/actions?page=${page}&limit=${limit}`),
};

export default adminService;
