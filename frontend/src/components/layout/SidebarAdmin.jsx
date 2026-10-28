import { NavLink, useNavigate } from 'react-router-dom';
import { Package, ClipboardList, Store, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

export default function SidebarAdmin({ onCloseMobile }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công.');
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin/products',
      label: 'Sản phẩm',
      icon: Package,
    },
    {
      to: '/admin/orders',
      label: 'Đơn hàng',
      icon: ClipboardList,
    },
  ];

  const getInitial = (name) => {
    if (!name) return 'A';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <aside className="w-64 h-full bg-gray-900 text-gray-100 flex flex-col justify-between shrink-0 select-none">
      {/* Top Header */}
      <div>
        <div className="h-16 px-5 border-b border-gray-800 flex items-center justify-between">
          <NavLink to="/admin/products" className="flex items-center gap-2 group">
            <span className="font-bold text-xl tracking-tight">
              <span className="text-primary-400 group-hover:text-primary-300 transition-colors">Funny</span>
              <span className="text-secondary-400 group-hover:text-secondary-300 transition-colors">Shop</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary-500/20 text-secondary-300 border border-secondary-500/30">
              Quản trị
            </span>
          </NavLink>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Đóng thanh điều hướng"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5" aria-label="Menu Quản trị">
          <div className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Quản lý hệ thống
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-700 text-white font-semibold border-l-4 border-secondary-300 shadow-brand/40'
                      : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 px-3 py-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Cửa hàng
          </div>

          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800/80 hover:text-white transition-all"
          >
            <Store className="size-5 shrink-0 text-secondary-400" aria-hidden="true" />
            <span>Về cửa hàng</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer User Block */}
      <div className="p-3 border-t border-gray-800">
        <div className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 text-sm shadow-soft">
              {getInitial(user?.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {user?.email || 'admin@funnyshop.vn'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700/60 transition-colors cursor-pointer shrink-0"
            aria-label="Đăng xuất khỏi trang quản trị"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

