import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';

/**
 * Footer component - Luxury Dark Japanese Minimalist
 * Dark background (ink / zinc-950), crisp high-contrast typography, 1px subtle divider lines.
 */
export default function Footer() {
  return (
    <footer className="w-full bg-[#121214] text-zinc-100 border-t border-zinc-800/80 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-zinc-800/80">
          {/* Column 1: Thương hiệu */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center" aria-label="Về trang chủ FunnyShop">
              <BrandLogo onDark={true} />
            </Link>
            <p className="text-xs sm:text-sm font-light text-zinc-400 leading-relaxed max-w-xs">
              Thời trang phong cách tối giản Nhật Bản. Tôn trọng sự tự nhiên, tinh tế trong từng đường kim mũi chỉ, chuẩn form dáng người Việt.
            </p>
            <div className="pt-2 text-xs font-light text-zinc-500 tracking-wider uppercase">
              Chất liệu tự nhiên · Tối giản · Bền vững
            </div>
          </div>

          {/* Column 2: Công ty */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-200">
              Công ty
            </h4>
            <ul className="space-y-2.5 text-xs font-light text-zinc-400">
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Hệ thống cửa hàng
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Bộ sưu tập Lookbook
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Dịch vụ */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-200">
              Dịch vụ khách hàng
            </h4>
            <ul className="space-y-2.5 text-xs font-light text-zinc-400">
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Chính sách đổi hàng trong 7 ngày
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Bảng quy đổi kích cỡ (Size Guide)
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Theo dõi đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Góp ý &amp; Phản hồi hệ thống
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Thanh toán & Mạng xã hội */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-200">
              Thanh toán &amp; Kết nối
            </h4>
            <div className="text-xs font-light text-zinc-400 space-y-1.5">
              <p>• Thanh toán nhận hàng (COD)</p>
              <p>• Thanh toán VietQR qua PayOS</p>
            </div>

            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Theo dõi chúng tôi</p>
              <div className="flex items-center gap-3.5 text-xs font-light text-zinc-300">
                <a href="#facebook" className="hover:text-vermilion hover:underline underline-offset-4 transition-colors">
                  Facebook
                </a>
                <span className="text-zinc-700">/</span>
                <a href="#instagram" className="hover:text-vermilion hover:underline underline-offset-4 transition-colors">
                  Instagram
                </a>
                <span className="text-zinc-700">/</span>
                <a href="#tiktok" className="hover:text-vermilion hover:underline underline-offset-4 transition-colors">
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Contact */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-light text-zinc-500">
          <div>
            © 2026 FunnyShop. Mọi quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-6 text-zinc-400">
            <span>Hotline: 1900 6868</span>
            <span className="text-zinc-700">·</span>
            <span>Email: contact@funnyshop.vn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
