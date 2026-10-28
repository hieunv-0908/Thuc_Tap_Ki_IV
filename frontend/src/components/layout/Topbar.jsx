import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Store, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Topbar({ onOpenMobile }) {
  const { user } = useAuthStore();
  const location = useLocation();

  // Compute breadcrumb based on current pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [
      { label: 'Quản trị', to: '/admin/products' },
    ];

    if (path.startsWith('/admin/products/new')) {
      crumbs.push({ label: 'Sản phẩm', to: '/admin/products' });
      crumbs.push({ label: 'Thêm mới' });
    } else if (path.match(/\/admin\/products\/\d+/)) {
      crumbs.push({ label: 'Sản phẩm', to: '/admin/products' });
      crumbs.push({ label: 'Chỉnh sửa' });
    } else if (path.startsWith('/admin/products')) {
      crumbs.push({ label: 'Sản phẩm' });
    } else if (path.startsWith('/admin/orders')) {
      crumbs.push({ label: 'Đơn hàng' });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const getInitial = (name) => {
    if (!name) return 'A';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-line px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="size-5" />
        </button>

        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-ink-muted">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.label} className="flex items-center">
                {idx > 0 && <ChevronRight className="size-4 text-ink-subtle mx-1.5 shrink-0" />}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-primary-700 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-ink font-semibold' : ''}>
                    {crumb.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right: Quick actions & Profile */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-line bg-gray-50 text-ink-muted hover:bg-gray-100 hover:text-ink transition-colors"
          title="Mở trang cửa hàng trong tab mới"
        >
          <Store className="size-3.5 text-secondary-500" />
          <span>Xem cửa hàng</span>
        </Link>

        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-line">
          <div className="size-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
            {getInitial(user?.fullName)}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-ink leading-tight flex items-center gap-1">
              {user?.fullName || 'Quản trị viên'}
              <ShieldCheck className="size-3.5 text-secondary-600" />
            </p>
            <p className="text-[11px] text-ink-subtle">Hệ thống FunnyShop</p>
          </div>
        </div>
      </div>
    </header>
  );
}

