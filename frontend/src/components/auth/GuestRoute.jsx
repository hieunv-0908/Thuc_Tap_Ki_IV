import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Route guard component for guest-only routes (Login, Register, Forgot Password).
 * Redirects already-authenticated users to home or previous redirect target.
 */
export default function GuestRoute() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for persisted auth state to rehydrate from localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect away from guest-only pages
  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/products" replace />;
    }

    const redirectUrl =
      new URLSearchParams(location.search).get('redirect') ||
      location.state?.from ||
      '/';

    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
}

