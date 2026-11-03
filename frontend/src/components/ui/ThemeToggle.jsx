import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const nextTheme = theme === 'dark' ? 'sáng' : 'tối';
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2.5 rounded-lg text-ink hover:bg-gray-100 transition-colors cursor-pointer"
      aria-label={`Chuyển sang giao diện ${nextTheme}`}
      title={`Chuyển sang giao diện ${nextTheme}`}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
