import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null, // { id, fullName, email, role: 'CUSTOMER' | 'ADMIN' }
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Đăng nhập: nhận đủ cặp token + thông tin user
      login: (token, refreshToken, user) => {
        set({
          token,
          refreshToken: refreshToken || null,
          user,
          isAuthenticated: Boolean(token && user),
        });
      },

      // Cập nhật nhanh cặp token sau khi auto-refresh mà không reset user
      setTokens: ({ token, refreshToken }) => {
        set((state) => ({
          token: token || state.token,
          refreshToken: refreshToken || state.refreshToken,
        }));
      },

      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updatedFields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        }));
      },

      isAdmin: () => {
        return get().user?.role === 'ADMIN';
      },
    }),
    {
      name: 'funnyshop_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
