import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import SidebarAdmin from '../components/layout/SidebarAdmin';
import Topbar from '../components/layout/Topbar';
import ToastContainer from '../components/ui/ToastContainer';
import Forbidden from '../pages/Forbidden';
import { useAuthStore } from '../store/authStore';

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // If Zustand hasn't rehydrated from localStorage yet, don't flash redirect
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">Đang tải bảng điều khiển...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Not an Admin: show Forbidden (403)
  if (user.role !== 'ADMIN') {
    return <Forbidden />;
  }

  return (
    <div className="min-h-screen flex bg-page text-ink antialiased selection:bg-primary-100 selection:text-primary-900">
      <ToastContainer />

      {/* Desktop Sidebar (hidden under lg) */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-40">
        <SidebarAdmin />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarAdmin onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
