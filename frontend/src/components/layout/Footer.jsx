import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Truck, ShieldCheck, Heart } from 'lucide-react';

/**
 * Footer component complying with Design.md 6.14 (v2.0)
 * Background: bg-gray-900 text-gray-100, top accent gradient h-1
 */
export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-100 mt-auto relative">
      {/* Top accent gradient bar (Design.md 2.7.2) */}
      <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500" />

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Thương hiệu */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xl font-bold tracking-tight select-none">
              <span className="text-2xl" aria-hidden="true">🎈</span>
              <span className="text-primary-400">Funny</span>
              <span className="text-secondary-300">Shop</span>
            </Link>

            <p className="text-sm text-gray-300 leading-relaxed">
              Thiên đường quà tặng độc đáo, gấu bông và đồ chơi sáng tạo. Mang niềm vui và tiếng cười đến mọi người mỗi ngày!
            </p>

            {/* Social round buttons */}
            <div className="flex items-center gap-2 pt-1">
              <span className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer select-none">
                Fb
              </span>
              <span className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer select-none">
                Ig
              </span>
              <span className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer select-none">
                Tk
              </span>
              <span className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer select-none">
                Yt
              </span>
            </div>
          </div>

          {/* Column 2: Danh mục nổi bật kèm emoji */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Danh mục nổi bật
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <Link to="/?category=3" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-2">
                  <span>🧩</span>
                  <span>Đồ chơi & Quà tặng vui</span>
                </Link>
              </li>
              <li>
                <Link to="/?category=1" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-2">
                  <span>🔑</span>
                  <span>Phụ kiện & Điện thoại</span>
                </Link>
              </li>
              <li>
                <Link to="/?category=2" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-2">
                  <span>🎁</span>
                  <span>Thời trang & Quà tặng</span>
                </Link>
              </li>
              <li>
                <Link to="/?category=4" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-2">
                  <span>🧸</span>
                  <span>Gối ôm & Gia dụng xinh</span>
                </Link>
              </li>
              <li>
                <Link to="/?category=5" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-2">
                  <span>✏️</span>
                  <span>Sách & Văn phòng phẩm</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ trợ khách hàng */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-primary-400 shrink-0" />
                <span>Giao hàng COD toàn quốc</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <span>Đổi trả thuận tiện</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 text-amber-400 shrink-0" />
                <span>Kiểm tra hàng trước thanh toán</span>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Tra cứu đơn hàng của tôi
                </Link>
              </li>
            </ul>

            {/* Payment badge */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs text-gray-200">
                💵 COD – Thanh toán khi nhận hàng
              </span>
            </div>
          </div>

          {/* Column 4: Liên hệ */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Thông tin liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 text-primary-400 shrink-0 mt-0.5" />
                <span>Tầng 5, Tòa nhà Sáng Tạo, Quận Cầu Giấy, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary-400 shrink-0" />
                <span>Hotline: 1900 8888 (8:00 - 22:00)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary-400 shrink-0" />
                <span>hotro@funnyshop.vn</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Location */}
      <div className="border-t border-white/10 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} FunnyShop. Tất cả quyền được bảo lưu.</p>
          <p className="flex items-center gap-1.5 text-xs text-gray-300">
            <span>Làm với</span>
            <Heart className="size-3 text-primary-400 fill-primary-400" />
            <span>tại Việt Nam</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
