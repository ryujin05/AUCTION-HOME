import { create } from 'zustand';
import api from '../lib/axios.js';

// 1. THÊM HÀM NÀY (Để tránh lỗi ReferenceError)
const extractError = (err) => err?.response?.data?.message || err?.message || "Lỗi không xác định";

export const usePropertyTypeStore = create((set, get) => ({
    propertyTypes: [],
    loading: false,
    error: null,

    fetchPropertyTypes: async () => {
        set({ loading: true, error: null });

        try {
            // Endpoint này sẽ thành: /api/property_type/getPropertyType
            // (Khớp với server.js app.use("/api/property_type") và route)
            const res = await api.get('/property_type/getPropertyType');

            set({
                propertyTypes: res.data.propertyTypes || [], // Thêm || [] để an toàn
                loading: false,
                error: null     
            });

            return {
                success: true,
                message: "Lấy dữ liệu loại tài sản thành công"
            };
        } catch (error) {
            const errorMessage = extractError(error); // Dùng hàm helper cho gọn

            set({
                loading: false,
                error: errorMessage,
                propertyTypes: []
            });

            console.error("Lỗi khi fetch property types: ", error);

            return {
                success: false,
                message: errorMessage
            };
        }
    },

    createPropertyType: async (typeData) => {
        set({ loading: true, error: null });

        try {
            // Endpoint: /api/property_type/createPropertyType
            const res = await api.post('/property_type/createPropertyType', typeData);

            // Fetch lại danh sách sau khi tạo mới để update UI
            get().fetchPropertyTypes();

            set({ loading: false });

            return {
                success: true,
                message: "Tạo loại tài sản thành công"
            }
        } catch (error) {
            const errorMessage = extractError(error);
            set({
                loading: false,
                error: errorMessage   
            });
            return {
                success: false,
                message: errorMessage
            };
        }
    },

    getPropertyTypeById: async (id) => {
        try {
            set({ loading: true, error: null });
            // Endpoint: /api/property_type/:id
            const res = await api.get(`/property_type/${id}`);
            
            set({ loading: false });
            return { success: true, data: res.data };
        } catch (err) {
            const message = extractError(err); // Bây giờ dòng này mới hoạt động đúng
            set({ loading: false, error: message });
            return { success: false, message };
        }
    }
}));