import api from "../lib/axios.js";

const notificationService = {
  getMyNotifications: (page = 1, limit = 10) =>
    api.get(`/notifications?page=${page}&limit=${limit}`),

  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put("/notifications/read-all"),
};

export default notificationService;
