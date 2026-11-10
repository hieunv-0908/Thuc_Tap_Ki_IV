import { useNavigate } from 'react-router-dom';
import { AlertCircle, Package, Store } from 'lucide-react';
import Button from '../../components/ui/Button';

/**
 * 404 page for the Admin Portal layout.
 * Keeps admin sidebar and navigation context intact.
 */
export default function AdminNotFound() {
  const navigate = useNavigate();

  return (
    <div className="py-16 md:py-24 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
      <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-5 shadow-soft">
        <AlertCircle className="size-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-3">
        Quản trị hệ thống · 404
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-2">
        Không tìm thấy trang quản trị
      </h1>

      <p className="text-sm text-ink-muted mb-8 leading-relaxed">
        Đường dẫn bạn yêu cầu không tồn tại trong phân hệ quản trị FunnyShop hoặc đã được di chuyển.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Button
          variant="primary"
          leftIcon={Package}
          onClick={() => navigate('/admin/products')}
        >
          Về quản lý sản phẩm
        </Button>
        <Button
          variant="outline"
          leftIcon={Store}
          onClick={() => navigate('/')}
        >
          Xem cửa hàng
        </Button>
      </div>
    </div>
  );
}
