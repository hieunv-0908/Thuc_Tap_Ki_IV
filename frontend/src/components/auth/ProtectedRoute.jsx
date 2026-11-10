import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Route guard component for authenticated routes.
 * Supports optional role-based access control.
 *
 * @param {Object} props
 * @param {string} [props.requiredRole] - Required user role (e.g., 'ADMIN')
 */
export default function ProtectedRoute({ requiredRole }) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for persisted auth state to rehydrate from localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">Đang tải trạng thái xác thực...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to login preserving target path
  if (!isAuthenticated || !user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        state={{ from: redirectTarget }}
        replace
      />
    );
  }

  // Role check if required
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

