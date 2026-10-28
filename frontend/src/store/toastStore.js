import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    set((state) => {
      // Keep at most 3 toasts simultaneously
      const updated = [...state.toasts, newToast].slice(-3);
      return { toasts: updated };
    });

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),
}));

// Convenient helper functions
export const toast = {
  success: (msg, duration = 4000) => useToastStore.getState().addToast(msg, 'success', duration),
  error: (msg, duration = 4000) => useToastStore.getState().addToast(msg, 'error', duration),
  warning: (msg, duration = 4000) => useToastStore.getState().addToast(msg, 'warning', duration),
  info: (msg, duration = 4000) => useToastStore.getState().addToast(msg, 'info', duration),
};
