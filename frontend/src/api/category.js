import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const categoryApi = {
  getCategories: async () => {
    if (isMock) {
      return await mockEngine.getCategories();
    }
    try {
      const res = await apiClient.get('/api/v1/categories');
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res?.data !== undefined) {
        if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.data?.content)) list = res.data.content;
      } else if (res?.result !== undefined) {
        if (Array.isArray(res.result)) list = res.result;
        else if (Array.isArray(res.result?.content)) list = res.result.content;
      } else if (Array.isArray(res?.content)) list = res.content;

      if (list && list.length > 0) return list;
      return await mockEngine.getCategories();
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.getCategories();
      }
      throw err;
    }
  },
};
