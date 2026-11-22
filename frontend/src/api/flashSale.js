import axiosClient from './axios';

export const flashSaleApi = {
  // Public
  getActiveFlashSale: () => {
    return axiosClient.get('/api/v1/flash-sales/active');
  },

  // Admin
  getAllFlashSales: () => {
    return axiosClient.get('/api/v1/admin/flash-sales');
  },

  getFlashSaleById: (id) => {
    return axiosClient.get(`/api/v1/admin/flash-sales/${id}`);
  },

  createFlashSale: (data) => {
    return axiosClient.post('/api/v1/admin/flash-sales', data);
  },

  updateFlashSale: (id, data) => {
    return axiosClient.put(`/api/v1/admin/flash-sales/${id}`, data);
  },

  deleteFlashSale: (id) => {
    return axiosClient.delete(`/api/v1/admin/flash-sales/${id}`);
  },

  toggleActive: (id) => {
    return axiosClient.patch(`/api/v1/admin/flash-sales/${id}/toggle-active`);
  },

  startNow: (id) => {
    return axiosClient.patch(`/api/v1/admin/flash-sales/${id}/start-now`);
  },
};

export default flashSaleApi;

