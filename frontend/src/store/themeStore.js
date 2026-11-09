import { create } from 'zustand';

const THEME_STORAGE_KEY = 'funnyshop_theme';
const initialTheme = localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';

document.documentElement.dataset.theme = initialTheme;

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,

  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },
}));
