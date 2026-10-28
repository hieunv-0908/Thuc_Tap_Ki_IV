import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * 403 Forbidden page per Design.md 7.11
 */
export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50 bg-dots overflow-hidden text-center">
      {/* Giant backdrop 403 number */}
      <div
        className="absolute select-none pointer-events-none text-8xl sm:text-9xl font-extrabold text-primary-200/50 tracking-widest z-0"
        aria-hidden="true"
      >
        403
      </div>

      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        {/* Floating Lock Emoji & Icon */}
        <div className="relative mb-6">
          <div className="text-7xl animate-float" role="img" aria-label="Khóa bảo vệ">
            🔒
          </div>
          <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center border-2 border-white shadow-soft">
            <ShieldAlert className="size-5" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
          Bạn không có quyền truy cập
        </h1>
        <p className="text-sm sm:text-base text-ink-muted mb-8 leading-relaxed">
          Khu vực quản trị chỉ dành riêng cho tài khoản Quản trị viên (ADMIN). Vui lòng đăng nhập bằng tài khoản có quyền phù hợp hoặc quay về trang chủ.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            leftIcon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Button
            variant="primary"
            leftIcon={Home}
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}

