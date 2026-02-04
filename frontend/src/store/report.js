import { create } from "zustand";
import api from "../lib/axios.js";

export const useReportStore = create((set) => ({
  reports: [],
  loading: false,
  error: null,

  createReport: async (listingId, reason, detail = "") => {
    try {
      set({ loading: true, error: null });

      const res = await api.post("/reports/createReport", {
        listingId,
        reason,
        detail,
      });

      set({ loading: false });
      return { success: true, message: res.data.message, data: res.data.report };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Lỗi khi gửi báo cáo";
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },
}));


