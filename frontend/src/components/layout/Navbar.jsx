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
import ConfirmDialog from '../ui/ConfirmDialog';
import ThemeToggle from '../ui/ThemeToggle';
import BrandLogo from '../ui/BrandLogo';

const QUICK_SEARCH_CHIPS = [
  { label: 'Áo thun Boxy', emoji: '👕' },
  { label: 'Áo sơ mi', emoji: '👔' },
  { label: 'Quần jeans & Váy', emoji: '👖' },
  { label: 'Váy đầm', emoji: '👗' },
  { label: 'Áo khoác Hoodie', emoji: '🧥' },
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
  const [previousLocationSearch, setPreviousLocationSearch] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // Keep the uncontrolled search draft in sync when browser navigation changes the URL.
  if (previousLocationSearch !== location.search) {
    setPreviousLocationSearch(location.search);
    setSearchQuery(new URLSearchParams(location.search).get('q') || '');
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);

    if (onSearch) {
      onSearch(query);
    } else {
      if (query) {
        navigate(`/?q=${encodeURIComponent(query)}`);
      } else {
        navigate('/');
      }
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

  const handleOpenLogoutConfirm = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
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
        className={`sticky top-0 z-40 h-[72px] w-full border-b border-line bg-paper/95 backdrop-blur-md transition-all duration-200 ${
          isScrolled ? 'shadow-2xs' : ''
        }`}
      >
        <div className="mx-auto w-full max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-ink hover:text-mute transition-colors cursor-pointer"
              aria-label="Mở menu danh mục"
            >
              <Menu className="size-6" />
            </button>

            <Link
              to="/"
              className="group flex items-center py-1 transition-opacity hover:opacity-80"
              aria-label="Về trang chủ FunnyShop"
            >
              <BrandLogo />
            </Link>
          </div>

          {/* Center: Minimalist Underline SearchBar (Desktop) with Quick Suggestions Dropdown */}
          <div
            ref={searchContainerRef}
            className="hidden lg:flex flex-1 max-w-md mx-6 relative items-center"
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Tìm sản phẩm..."
                className="h-10 w-full border-b border-line bg-transparent pl-8 pr-16 text-sm font-light text-ink placeholder:text-mute placeholder:font-light focus:outline-none focus:border-ink transition-colors"
              />
              <Search className="size-4 text-mute absolute left-0 pointer-events-none" />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (onSearch) {
                      onSearch('');
                    } else if (location.search.includes('q=')) {
                      navigate('/');
                    }
                  }}
                  className="absolute right-12 text-mute hover:text-ink p-1 cursor-pointer"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-0 text-xs uppercase tracking-widest text-ink hover:text-vermilion font-medium transition-colors cursor-pointer"
              >
                Tìm
              </button>
            </form>

            {/* Quick Keyword Suggestions Dropdown on Focus */}
            {isSearchFocused && (
              <div className="absolute top-12 left-0 right-0 bg-paper border border-line p-4 z-50 animate-in fade-in duration-150">
                <p className="text-[11px] uppercase tracking-widest text-mute mb-2.5">
                  Xu hướng tìm kiếm:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SEARCH_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onMouseDown={() => handleSelectQuickSuggestion(chip.label)}
                      className="text-xs px-2.5 py-1 border border-line text-ink hover:border-ink transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              className="lg:hidden p-2 text-ink hover:text-mute transition-colors cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="size-5" />
            </button>

            {/* Cart Icon with Pop-animated Badge */}
            <Link
              to="/cart"
              className="relative p-2 text-ink hover:text-mute transition-colors flex items-center justify-center cursor-pointer"
              aria-label={`Giỏ hàng có ${totalCartCount} sản phẩm`}
            >
              <ShoppingCart className="size-5" />
              {totalCartCount > 0 && (
                <span
                  key={totalCartCount}
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-ink text-paper text-[10px] font-bold flex items-center justify-center animate-[pop_300ms_ease-out]"
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
                  className="flex items-center gap-2 py-1.5 px-2.5 border border-line hover:border-ink transition-colors cursor-pointer"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu tài khoản"
                >
                  <div className="size-6 rounded-full bg-sand text-ink font-serif text-xs flex items-center justify-center">
                    {getInitials(user?.fullName)}
                  </div>
                  <span className="hidden md:inline text-xs font-light tracking-wide text-ink max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown className="size-3.5 text-mute hidden md:inline" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 border border-line bg-paper py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-line">
                      <p className="text-[11px] text-mute uppercase tracking-widest">Tài khoản</p>
                      <p className="text-sm font-serif text-ink truncate mt-0.5">{user?.fullName}</p>
                      <p className="text-xs text-mute truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-sand/40 transition-colors"
                      >
                        <User className="size-3.5 text-mute" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-sand/40 transition-colors"
                      >
                        <ClipboardList className="size-3.5 text-mute" />
                        <span>Đơn hàng của tôi</span>
                      </Link>

                      {isAdmin() && (
                        <Link
                          to="/admin/products"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="px-4 py-2 text-xs font-medium text-vermilion hover:bg-vermilion/10 flex items-center gap-2 transition-colors"
                        >
                          <Shield className="size-3.5 text-vermilion" />
                          <span>Trang quản trị (Admin)</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-line pt-1">
                      <button
                        type="button"
                        onClick={handleOpenLogoutConfirm}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-vermilion hover:bg-vermilion/10 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="size-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" state={{ from: location.pathname }}>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs uppercase tracking-wider text-ink hover:text-mute transition-colors cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 border border-ink text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-paper transition-colors cursor-pointer"
                  >
                    Đăng ký
                  </button>
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
                placeholder="Tìm áo thun, quần jeans, váy đầm..."
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
              <div>
                <BrandLogo size="sm" />
                <p className="text-xs text-ink-muted mt-2">
                  {isAuthenticated ? `Chào, ${user?.fullName}!` : 'Chào mừng bạn đến với FunnyShop!'}
                </p>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-ink">Giao diện</span>
                <ThemeToggle />
              </div>

              {isAuthenticated ? (
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={LogOut}
                  onClick={handleOpenLogoutConfirm}
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

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        variant="danger"
      />
    </>
  );
}
