import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import ScrollToTopOnNavigate from './components/ui/ScrollToTopOnNavigate';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Feedback from './pages/Feedback';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminFeedbacks from './pages/admin/AdminFeedbacks';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBanners from './pages/admin/AdminBanners';
import AdminFlashSales from './pages/admin/AdminFlashSales';
import AdminNotFound from './pages/admin/AdminNotFound';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnNavigate />
      <Routes>
        {/* Main Store Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Guest-only routes: redirects already-logged-in users */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Customer protected routes: requires login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/feedbacks" element={<Feedback />} />
          </Route>

          {/* Fallback 404 for Storefront */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Management Layout: requires ADMIN role */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="flash-sales" element={<AdminFlashSales />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="feedbacks" element={<AdminFeedbacks />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="banners" element={<AdminBanners />} />
            {/* Catch-all 404 inside Admin Layout */}
            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
