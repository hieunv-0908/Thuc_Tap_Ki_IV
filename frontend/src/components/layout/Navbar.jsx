import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  LogOut,
  Package,
  ClipboardList,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';
import Button from '../ui/Button';

const QUICK_SEARCH_CHIPS = [
  { label: 'Gấu bông Capybara', emoji: '🧸' },
  { label: 'Đồ chơi vui nhộn', emoji: '🧩' },
  { label: 'Hộp quà bất ngờ', emoji: '🎁' },
  { label: 'Móc khóa độc lạ', emoji: '🔑' },
];

/**
 * Navbar component complying with Design.md 6.13
 */
export default function Navbar({ onSearch, initialSearchQuery = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuthStore();
  const totalCartCount = useCartStore((s) => s.getTotalCount());

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Scroll shadow effect > 8px
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);

    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectQuickSuggestion = (itemLabel) => {
    setSearchQuery(itemLabel);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    if (onSearch) {
      onSearch(itemLabel);
    } else {
      navigate(`/?q=${encodeURIComponent(itemLabel)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    toast.info('Đã đăng xuất tài khoản.');
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const displayCartCount = totalCartCount > 9 ? '9+' : totalCartCount;

  return (
    <>
      <header
        className={`sticky top-0 z-40 h-16 w-full border-b border-line bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
          isScrolled ? 'shadow-soft' : ''
        }`}
      >
        <div className="mx-auto w-full max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-ink hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Mở menu danh mục"
            >
              <Menu className="size-6" />
            </button>

            <Link
              to="/"
              className="group flex items-center gap-1.5 text-xl font-bold tracking-tight select-none"
            >
              <span
                className="text-2xl inline-block -rotate-12 group-hover:rotate-0 transition-transform duration-200"
                aria-hidden="true"
              >
                🎈
              </span>
              <span className="text-primary-700">Funny</span>
              <span className="text-secondary-500">Shop</span>
            </Link>
          </div>

          {/* Center: SearchBar (Desktop) with Quick Suggestions Dropdown */}
          <div
            ref={searchContainerRef}
            className="hidden lg:flex flex-1 max-w-xl mx-4 relative items-center"
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Tìm sản phẩm quà tặng, gối ôm, đồ chơi..."
                className="h-11 w-full rounded-full border border-line bg-gray-100 pl-11 pr-24 text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
              />
              <Search className="size-4 text-ink-subtle absolute left-4 pointer-events-none" />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (onSearch) onSearch('');
                  }}
                  className="absolute right-20 text-ink-subtle hover:text-ink p-1 cursor-pointer"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-1.5 h-8 px-4 rounded-full bg-primary-700 text-white text-xs font-semibold hover:bg-primary-800 transition-colors cursor-pointer"
              >
                Tìm
              </button>
            </form>

            {/* Quick Keyword Suggestions Dropdown on Focus */}
            {isSearchFocused && (
              <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl border border-line shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-xs font-semibold text-ink-subtle mb-2 px-1">
                  Gợi ý từ khóa hot hôm nay:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SEARCH_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onMouseDown={() => handleSelectQuickSuggestion(chip.label)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      <span>{chip.emoji}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              className="lg:hidden p-2.5 rounded-lg text-ink hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="size-5" />
            </button>

            {/* Cart Icon with Pop-animated Badge */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-lg text-ink hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer"
              aria-label={`Giỏ hàng có ${totalCartCount} sản phẩm`}
            >
              <ShoppingCart className="size-5" />
              {totalCartCount > 0 && (
                <span
                  key={totalCartCount}
                  className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center shadow-xs animate-[pop_300ms_ease-out]"
                  aria-hidden="true"
                >
                  {displayCartCount}
                </span>
              )}
            </Link>

            {/* User Menu or Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-line hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu tài khoản"
                >
                  <div className="size-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    {getInitials(user?.fullName)}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-ink max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown className="size-4 text-ink-subtle hidden md:inline" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white shadow-md py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-line">
                      <p className="text-xs text-ink-subtle">Tài khoản</p>
                      <p className="text-sm font-semibold text-ink truncate">{user?.fullName}</p>
                      <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-gray-50 transition-colors"
                      >
                        <User className="size-4 text-ink-subtle" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-gray-50 transition-colors"
                      >
                        <ClipboardList className="size-4 text-ink-subtle" />
                        <span>Đơn hàng của tôi</span>
                      </Link>

                      {isAdmin() && (
                        <Link
                          to="/admin/products"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-secondary-700 bg-secondary-50 hover:bg-secondary-100 flex items-center gap-2 rounded-md mx-2 my-1 transition-colors"
                        >
                          <Shield className="size-3.5 text-secondary-500" />
                          <span>Trang quản trị (Admin)</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-line pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="size-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" state={{ from: location.pathname }}>
                  <Button variant="outline" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Expand Bar */}
        {isMobileSearchOpen && (
          <div className="lg:hidden border-t border-line bg-white p-3 px-4 shadow-sm animate-in slide-in-from-top-1 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                autoFocus
                className="h-10 w-full rounded-lg border border-line bg-gray-50 pl-10 pr-20 text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
              />
              <Search className="size-4 text-ink-subtle absolute left-3" />
              <button
                type="submit"
                className="absolute right-1.5 h-7 px-3 rounded-md bg-primary-700 text-white text-xs font-semibold cursor-pointer"
              >
                Tìm
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer (Left Drawer) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Greeting Panel: bg-gradient-to-r from-primary-50 to-secondary-50 */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-5 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">🎈</span>
                <div>
                  <div className="font-bold text-base text-ink">
                    <span className="text-primary-700">Funny</span>
                    <span className="text-secondary-500">Shop</span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {isAuthenticated ? `Chào, ${user?.fullName}!` : 'Chào bạn đến với shop!'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-ink-subtle hover:text-ink cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="p-4 flex-1 overflow-y-auto space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-gray-100 transition-colors"
              >
                <Package className="size-5 text-primary-700" />
                <span>Trang chủ sản phẩm</span>
              </Link>

              <Link
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="size-5 text-primary-600" />
                  <span>Giỏ hàng</span>
                </div>
                {totalCartCount > 0 && (
                  <span className="bg-primary-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalCartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-gray-100 transition-colors"
                  >
                    <ClipboardList className="size-5 text-secondary-500" />
                    <span>Đơn hàng của tôi</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-gray-100 transition-colors"
                  >
                    <User className="size-5 text-ink-subtle" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  {isAdmin() && (
                    <Link
                      to="/admin/products"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-secondary-800 bg-secondary-50 hover:bg-secondary-100 transition-colors"
                    >
                      <Shield className="size-5 text-secondary-600" />
                      <span>Trang quản trị (Admin)</span>
                    </Link>
                  )}
                </>
              ) : null}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-line bg-gray-50/50">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={LogOut}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth>
                      Tạo tài khoản
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
