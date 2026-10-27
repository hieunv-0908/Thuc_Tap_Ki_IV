import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Heart, ShieldCheck, Truck, Clock } from 'lucide-react';

/**
 * Footer component complying with Design.md 6.14
 */
export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-line mt-auto">
      {/* Value propositions */}
      <div className="border-b border-line bg-gray-50/50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="size-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Giao hàng COD toàn quốc</h4>
              <p className="text-xs text-ink-muted">Kiểm tra hàng trước khi thanh toán</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="size-11 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Đảm bảo chất lượng</h4>
              <p className="text-xs text-ink-muted">100% đúng mẫu mã và hình ảnh</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="size-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Hỗ trợ 24/7</h4>
              <p className="text-xs text-ink-muted">Tư vấn chọn quà tặng nhiệt tình</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: About */}
        <div>
          <div className="flex items-center gap-1.5 text-xl font-bold tracking-tight mb-3">
            <span className="text-2xl" aria-hidden="true">🎈</span>
            <span className="text-primary-700">Funny</span>
            <span className="text-secondary-500">Shop</span>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed mb-4 max-w-sm">
            FunnyShop mang đến những món quà tặng sáng tạo, đồ chơi hài hước và phụ kiện độc đáo,
            giúp cuộc sống của bạn luôn tràn ngập tiếng cười và niềm vui mỗi ngày.
          </p>
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span>Thiết kế với</span>
            <Heart className="size-3.5 text-primary-700 fill-primary-700" />
            <span>dành cho người trẻ Việt Nam</span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
            Liên kết nhanh
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="text-ink-muted hover:text-primary-700 transition-colors">
                Trang chủ sản phẩm
              </Link>
            </li>
            <li>
              <Link to="/cart" className="text-ink-muted hover:text-primary-700 transition-colors">
                Giỏ hàng của bạn
              </Link>
            </li>
            <li>
              <Link to="/orders" className="text-ink-muted hover:text-primary-700 transition-colors">
                Theo dõi đơn hàng
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-ink-muted hover:text-primary-700 transition-colors">
                Đăng nhập / Đăng ký
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
            Thông tin liên hệ
          </h3>
          <ul className="space-y-3 text-sm text-ink-muted">
            <li className="flex items-start gap-2.5">
              <MapPin className="size-4 text-primary-700 shrink-0 mt-0.5" />
              <span>Tầng 5, Tòa nhà Sáng Tạo, Quận Cầu Giấy, Hà Nội</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 text-primary-700 shrink-0" />
              <span>Hotline: 1900 8888 (8:00 - 22:00)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 text-primary-700 shrink-0" />
              <span>hotro@funnyshop.vn</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-line py-5 text-center">
        <p className="text-sm text-ink-subtle">
          &copy; {new Date().getFullYear()} FunnyShop. Tất cả quyền được bảo lưu. Dự án E-Commerce MVP.
        </p>
      </div>
    </footer>
  );
}
