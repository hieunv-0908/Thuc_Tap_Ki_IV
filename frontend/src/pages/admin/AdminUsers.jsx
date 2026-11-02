import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  Eye,
  X,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';
import { formatDate } from '../../utils/formatDate';

const ITEMS_PER_PAGE = 8;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'CUSTOMER' | 'ADMIN'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BANNED'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Action dialog targets
  const [statusTarget, setStatusTarget] = useState(null); // { user, nextStatus }
  const [roleTarget, setRoleTarget] = useState(null); // { user, nextRole }
  const [deleteTarget, setDeleteTarget] = useState(null); // { user }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      setError(err.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setError(null);
        const res = await adminApi.getUsers();
        if (!ignore) {
          setUsers(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải danh sách người dùng.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const customers = users.filter((u) => u.role === 'CUSTOMER').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const banned = users.filter((u) => u.status === 'BANNED' || u.status === 'INACTIVE').length;
    return { total, customers, admins, active, banned };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search by name, username, email, phone
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = user.fullName?.toLowerCase().includes(q);
        const matchUsername = user.username?.toLowerCase().includes(q);
        const matchEmail = user.email?.toLowerCase().includes(q);
        const matchPhone = user.phone?.includes(q);
        if (!matchName && !matchUsername && !matchEmail && !matchPhone) return false;
      }

      // Filter by role
      if (roleFilter !== 'ALL' && user.role !== roleFilter) {
        return false;
      }

      // Filter by status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && user.status !== 'ACTIVE') return false;
        if (statusFilter === 'BANNED' && user.status === 'ACTIVE') return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Handle Form Input Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate Create User Form
  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Họ và tên không được để trống';
    if (!formData.email.trim()) {
      errs.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Email không hợp lệ';
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Create User Submit
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await adminApi.createUser({
        ...formData,
        username: formData.username.trim() || formData.email.split('@')[0],
      });
      toast.success(`Đã thêm thành công người dùng "${formData.fullName}".`);
      setIsCreateModalOpen(false);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      });
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi tạo người dùng:', err);
      toast.error(err.message || 'Không thể tạo người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update (Lock / Unlock)
  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    const { user, nextStatus } = statusTarget;
    try {
      setIsSubmitting(true);
      await adminApi.updateUserStatus(user.id, nextStatus);
      toast.success(
        nextStatus === 'BANNED'
          ? `Đã khóa tài khoản "${user.fullName || user.username}".`
          : `Đã mở khóa tài khoản "${user.fullName || user.username}".`
      );
      setStatusTarget(null);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err);
      toast.error(err.message || 'Không thể cập nhật trạng thái người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleTarget) return;
    const { user, nextRole } = roleTarget;
    try {
      setIsSubmitting(true);
      await adminApi.updateUserRole(user.id, nextRole);
      toast.success(
        `Đã phân quyền "${nextRole === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}" cho ${user.fullName || user.username}.`
      );
      setRoleTarget(null);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi phân quyền:', err);
      toast.error(err.message || 'Không thể thay đổi vai trò người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete User
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      await adminApi.deleteUser(deleteTarget.id);
      toast.success(`Đã xóa người dùng "${deleteTarget.fullName || deleteTarget.username}".`);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      console.error('Lỗi xóa người dùng:', err);
      toast.error(err.message || 'Không thể xóa người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (row) => {
        const initial = (row.fullName || row.username || 'U').trim().charAt(0).toUpperCase();
        const isAdmin = row.role === 'ADMIN';

        return (
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs ${
                isAdmin
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-primary-100 text-primary-800 border-primary-200'
              }`}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink line-clamp-1">{row.fullName || 'Chưa cập nhật tên'}</p>
              <p className="text-xs text-ink-muted truncate">@{row.username || row.email?.split('@')[0]}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      render: (row) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Mail className="size-3 text-ink-subtle shrink-0" />
            <span className="truncate max-w-[180px]">{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1.5 text-ink-muted">
              <Phone className="size-3 text-ink-subtle shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      className: 'whitespace-nowrap',
      render: (row) => {
        const isAdmin = row.role === 'ADMIN';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isAdmin
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {isAdmin ? <Shield className="size-3 text-purple-600" /> : <UserCheck className="size-3 text-blue-600" />}
            <span>{isAdmin ? 'Quản trị viên' : 'Khách hàng'}</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (row) => {
        const isActive = row.status === 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>{isActive ? 'Đang hoạt động' : 'Đã khóa'}</span>
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      className: 'whitespace-nowrap text-xs text-ink-muted',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-ink-subtle" />
          <span>{row.createdAt ? formatDate(row.createdAt) : '—'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (row) => {
        const isBanned = row.status === 'BANNED' || row.status === 'INACTIVE';
        const nextRole = row.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';

        return (
          <div className="flex items-center justify-end gap-1">
            {/* View Detail */}
            <button
              type="button"
              onClick={() => setSelectedUserDetail(row)}
              className="p-1.5 rounded-lg text-ink-muted hover:text-secondary-700 hover:bg-secondary-50 transition-colors cursor-pointer"
              title="Xem chi tiết người dùng"
              aria-label={`Xem chi tiết ${row.fullName || row.username}`}
            >
              <Eye className="size-4" />
            </button>

            {/* Toggle Role */}
            <button
              type="button"
              onClick={() => setRoleTarget({ user: row, nextRole })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                row.role === 'ADMIN'
                  ? 'text-purple-600 hover:bg-purple-50'
                  : 'text-ink-muted hover:text-purple-700 hover:bg-purple-50'
              }`}
              title={row.role === 'ADMIN' ? 'Hạ quyền xuống Khách hàng' : 'Nâng cấp thành Quản trị viên'}
              aria-label={`Đổi vai trò ${row.fullName || row.username}`}
            >
              <Shield className="size-4" />
            </button>

            {/* Toggle Lock / Unlock */}
            <button
              type="button"
              onClick={() => setStatusTarget({ user: row, nextStatus: isBanned ? 'ACTIVE' : 'BANNED' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isBanned
                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                  : 'text-ink-muted hover:text-red-700 hover:bg-red-50'
              }`}
              title={isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              aria-label={isBanned ? `Mở khóa ${row.username}` : `Khóa ${row.username}`}
            >
              {isBanned ? <Unlock className="size-4" /> : <Lock className="size-4" />}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              title="Xóa người dùng"
              aria-label={`Xóa ${row.fullName || row.username}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">Quản lý người dùng</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Xem danh sách thành viên, kiểm soát trạng thái hoạt động và phân quyền quản trị FunnyShop
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={UserPlus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Thêm người dùng
        </Button>
      </div>

      {/* StatCards Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Tổng người dùng"
          value={stats.total}
          variant="primary"
          subtext="Tài khoản trên hệ thống"
        />
        <StatCard
          icon={UserCheck}
          label="Khách hàng"
          value={stats.customers}
          variant="secondary"
          subtext="Tài khoản mua sắm"
        />
        <StatCard
          icon={Shield}
          label="Quản trị viên"
          value={stats.admins}
          variant="warning"
          subtext="Quyền quản lý hệ thống"
        />
        <StatCard
          icon={UserX}
          label="Tài khoản bị khóa"
          value={stats.banned}
          variant="danger"
          subtext="Không thể đăng nhập"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl border border-line bg-white shadow-soft space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative flex items-center">
            <Search className="size-4 text-ink-subtle absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, username, email hoặc SĐT..."
              className="h-10 w-full pl-9 pr-9 rounded-lg border border-line bg-page text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 p-1 rounded-md text-ink-subtle hover:text-ink cursor-pointer"
                aria-label="Xóa ô tìm kiếm"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full px-3 rounded-lg border border-line bg-page text-sm text-ink focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full px-3 rounded-lg border border-line bg-page text-sm text-ink focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="BANNED">Đã bị khóa</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line">
            <span>
              Tìm thấy <strong className="text-ink">{filteredUsers.length}</strong> tài khoản phù hợp
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-primary-700 hover:underline font-medium cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table & Pagination */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={paginatedUsers}
          loading={loading}
          error={error}
          onRetry={fetchUsers}
          emptyTitle="Không tìm thấy người dùng"
          emptyDescription="Không có tài khoản nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
        />

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-ink-muted">
              Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredUsers.length)} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} trên tổng số{' '}
              <strong className="text-ink">{filteredUsers.length}</strong> người dùng
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Thêm người dùng mới"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              placeholder="VD: Nguyễn Văn A"
              className="w-full h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200"
            />
            {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Tên đăng nhập (Username)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                placeholder="VD: nguyenvana"
                className="w-full h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="VD: 0912345678"
                className="w-full h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="VD: nguyenvana@gmail.com"
              className="w-full h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200"
            />
            {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-secondary-200"
            />
            {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Vai trò</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                className="w-full h-10 px-3 rounded-lg border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary-200"
              >
                <option value="CUSTOMER">Khách hàng</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full h-10 px-3 rounded-lg border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary-200"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="BANNED">Khóa tài khoản</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <Modal
          isOpen={Boolean(selectedUserDetail)}
          onClose={() => setSelectedUserDetail(null)}
          title="Thông tin tài khoản"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-line">
              <div
                className={`size-14 rounded-full flex items-center justify-center font-bold text-xl border ${
                  selectedUserDetail.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : 'bg-primary-100 text-primary-800 border-primary-200'
                }`}
              >
                {(selectedUserDetail.fullName || selectedUserDetail.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">{selectedUserDetail.fullName}</h3>
                <p className="text-xs text-ink-muted">@{selectedUserDetail.username}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      selectedUserDetail.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {selectedUserDetail.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      selectedUserDetail.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selectedUserDetail.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm divide-y divide-line">
              <div className="flex justify-between py-2">
                <span className="text-ink-muted">ID người dùng:</span>
                <span className="font-semibold text-ink">#{selectedUserDetail.id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-muted">Email:</span>
                <span className="font-medium text-ink">{selectedUserDetail.email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-muted">Số điện thoại:</span>
                <span className="font-medium text-ink">{selectedUserDetail.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-muted">Ngày tham gia:</span>
                <span className="font-medium text-ink">
                  {selectedUserDetail.createdAt ? formatDate(selectedUserDetail.createdAt) : '—'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-line">
              <Button variant="secondary" onClick={() => setSelectedUserDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Lock / Unlock Dialog */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        onClose={() => !isSubmitting && setStatusTarget(null)}
        onConfirm={handleConfirmStatusChange}
        title={statusTarget?.nextStatus === 'BANNED' ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản?'}
        description={
          statusTarget?.nextStatus === 'BANNED'
            ? `Bạn có chắc muốn khóa tài khoản "${statusTarget?.user?.fullName || statusTarget?.user?.username}"? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
            : `Mở khóa cho tài khoản "${statusTarget?.user?.fullName || statusTarget?.user?.username}" để người dùng có thể đăng nhập bình thường.`
        }
        confirmText={statusTarget?.nextStatus === 'BANNED' ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelText="Hủy"
        variant={statusTarget?.nextStatus === 'BANNED' ? 'danger' : 'primary'}
        loading={isSubmitting}
      />

      {/* Confirm Role Change Dialog */}
      <ConfirmDialog
        isOpen={Boolean(roleTarget)}
        onClose={() => !isSubmitting && setRoleTarget(null)}
        onConfirm={handleConfirmRoleChange}
        title="Thay đổi vai trò người dùng?"
        description={`Bạn có chắc muốn chuyển vai trò của "${
          roleTarget?.user?.fullName || roleTarget?.user?.username
        }" thành ${roleTarget?.nextRole === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Khách hàng (CUSTOMER)'}?`}
        confirmText="Xác nhận đổi quyền"
        cancelText="Hủy"
        variant="primary"
        loading={isSubmitting}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isSubmitting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa người dùng?"
        description={`Bạn có chắc chắn muốn xóa người dùng "${
          deleteTarget?.fullName || deleteTarget?.username
        }"? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa người dùng"
        cancelText="Hủy"
        variant="danger"
        loading={isSubmitting}
      />
    </div>
  );
}
