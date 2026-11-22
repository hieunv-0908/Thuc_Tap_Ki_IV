import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { addressApi } from '../../api/address';
import { toast } from '../../store/toastStore';
import AddressCard from '../address/AddressCard';
import AddressModal from '../address/AddressModal';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await addressApi.getMyAddresses();
      setAddresses(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể tải danh sách địa chỉ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await addressApi.getMyAddresses();
        if (isMounted) setAddresses(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        if (isMounted) toast.error(err.response?.data?.message || err.message || 'Không thể tải danh sách địa chỉ.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [fetchAddresses]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAddress(null);
  };

  const handleSubmitModal = async (payload) => {
    try {
      setIsSubmitting(true);
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, payload);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        await addressApi.createAddress(payload);
        toast.success('Thêm địa chỉ mới thành công!');
      }
      handleCloseModal();
      await fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Thao tác địa chỉ thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) return;
    try {
      await addressApi.deleteAddress(id);
      toast.success('Đã xóa địa chỉ');
      await fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xóa địa chỉ.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressApi.setDefaultAddress(id);
      toast.success('Đã đặt làm địa chỉ mặc định!');
      await fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể đặt mặc định.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top action: Title & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">Sổ địa chỉ nhận hàng</h3>
          <p className="text-xs text-ink-muted">
            Quản lý các địa chỉ giao hàng để đặt hàng nhanh chóng hơn
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={handleOpenAdd}
          className="font-semibold shadow-brand shrink-0"
        >
          Thêm địa chỉ mới
        </Button>
      </div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center space-y-3">
          <div className="size-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <MapPin className="size-7" />
          </div>
          <div>
            <h4 className="font-bold text-ink text-base">Chưa có địa chỉ nào</h4>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              Lưu địa chỉ nhận hàng giúp bạn không phải nhập lại thông tin mỗi lần thanh toán.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={Plus}
            onClick={handleOpenAdd}
            className="font-semibold"
          >
            Thêm địa chỉ đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Address Modal (Thêm / Sửa) */}
      <AddressModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        address={editingAddress}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

