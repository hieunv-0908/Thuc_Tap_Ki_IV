import axiosClient from './axios';

export const addressApi = {
  getMyAddresses: () => {
    return axiosClient.get('/api/v1/addresses');
  },

  getAddressDetail: (id) => {
    return axiosClient.get(`/api/v1/addresses/${id}`);
  },

  createAddress: (data) => {
    return axiosClient.post('/api/v1/addresses', data);
  },

  updateAddress: (id, data) => {
    return axiosClient.put(`/api/v1/addresses/${id}`, data);
  },

  deleteAddress: (id) => {
    return axiosClient.delete(`/api/v1/addresses/${id}`);
  },

  setDefaultAddress: (id) => {
    return axiosClient.patch(`/api/v1/addresses/${id}/set-default`);
  },
};

export default addressApi;

