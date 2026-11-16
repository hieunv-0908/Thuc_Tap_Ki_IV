package com.funnyshop.service.impl;

import com.funnyshop.dto.request.VoucherCreateRequest;
import com.funnyshop.dto.request.VoucherUpdateRequest;
import com.funnyshop.dto.response.VoucherApplyResponse;
import com.funnyshop.dto.response.VoucherResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.User;
import com.funnyshop.entity.Voucher;
import com.funnyshop.entity.VoucherUsage;
import com.funnyshop.enums.DiscountType;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceAlreadyExistsException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.VoucherRepository;
import com.funnyshop.repository.VoucherUsageRepository;
import com.funnyshop.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAvailableVouchers(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> vouchers = voucherRepository.findAvailableVouchers(now);

        return vouchers.stream()
                .filter(v -> {
                    if (userId == null) {
                        return true;
                    }
                    long count = voucherUsageRepository.countByVoucherIdAndUserId(v.getId(), userId);
                    return count < v.getPerUserLimit();
                })
                .map(VoucherResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherApplyResponse applyVoucher(String code, BigDecimal subtotal, Long userId) {
        if (code == null || code.isBlank()) {
            throw new AppException("Vui lòng nhập mã voucher!", HttpStatus.BAD_REQUEST);
        }

        String normalizedCode = code.trim().toUpperCase();
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá: " + normalizedCode));

        validateVoucherRules(voucher, subtotal, userId);

        BigDecimal discountAmount = calculateDiscount(voucher, subtotal);
        BigDecimal finalAmount = subtotal.subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        return VoucherApplyResponse.builder()
                .valid(true)
                .voucherCode(voucher.getCode())
                .voucherName(voucher.getName())
                .discountAmount(discountAmount)
                .subtotalAmount(subtotal)
                .finalAmount(finalAmount)
                .message("Áp dụng mã giảm giá thành công!")
                .build();
    }

    @Override
    @Transactional
    public Voucher validateAndGetVoucherForCheckout(String code, BigDecimal subtotal, Long userId) {
        if (code == null || code.isBlank()) {
            return null;
        }

        String normalizedCode = code.trim().toUpperCase();
        // Khóa bi quan hàng Voucher để chống race condition
        Voucher voucher = voucherRepository.findByCodeWithLock(normalizedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá: " + normalizedCode));

        validateVoucherRules(voucher, subtotal, userId);

        return voucher;
    }

    @Override
    public BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal) {
        if (voucher == null || subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (voucher.getMaxDiscountAmount() != null
                    && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VoucherResponse> getAllVouchers(String search, Boolean isActive, Pageable pageable) {
        return voucherRepository.findAllWithFilters(search, isActive, pageable)
                .map(VoucherResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherResponse getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher ID: " + id));
        return VoucherResponse.fromEntity(voucher);
    }

    @Override
    @Transactional
    public VoucherResponse createVoucher(VoucherCreateRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();

        if (voucherRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ResourceAlreadyExistsException("Mã voucher '" + normalizedCode + "' đã tồn tại trên hệ thống!");
        }

        validateVoucherDatesAndValues(request.getStartDate(), request.getEndDate(),
                request.getDiscountType(), request.getDiscountValue());

        Voucher voucher = Voucher.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .perUserLimit(request.getPerUserLimit() != null ? request.getPerUserLimit() : 1)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Voucher saved = voucherRepository.save(voucher);
        log.info("Admin đã tạo voucher mới: ID={}, Code={}", saved.getId(), saved.getCode());
        return VoucherResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(Long id, VoucherUpdateRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher ID: " + id));

        validateVoucherDatesAndValues(request.getStartDate(), request.getEndDate(),
                request.getDiscountType(), request.getDiscountValue());

        voucher.setName(request.getName().trim());
        voucher.setDescription(request.getDescription());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setMinOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO);
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setPerUserLimit(request.getPerUserLimit() != null ? request.getPerUserLimit() : 1);
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
        if (request.getIsActive() != null) {
            voucher.setIsActive(request.getIsActive());
        }

        Voucher updated = voucherRepository.save(voucher);
        log.info("Admin đã cập nhật voucher: ID={}, Code={}", updated.getId(), updated.getCode());
        return VoucherResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public VoucherResponse toggleVoucherStatus(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher ID: " + id));

        boolean newStatus = !Boolean.TRUE.equals(voucher.getIsActive());
        voucher.setIsActive(newStatus);
        Voucher updated = voucherRepository.save(voucher);
        log.info("Admin đã đổi trạng thái voucher ID={}: isActive={}", id, newStatus);
        return VoucherResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher ID: " + id));

        if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
            voucher.setIsActive(false);
            voucherRepository.save(voucher);
            log.info("Voucher ID={} đã có {} lượt dùng, chuyển trạng thái isActive=false thay vì xóa vật lý",
                    id, voucher.getUsedCount());
        } else {
            voucherRepository.delete(voucher);
            log.info("Đã xóa vĩnh viễn voucher ID={} chưa qua sử dụng", id);
        }
    }

    @Override
    @Transactional
    public void recordVoucherUsage(Voucher voucher, User user, Order order, BigDecimal discountAmount) {
        if (voucher == null || order == null) {
            return;
        }

        voucher.setUsedCount((voucher.getUsedCount() != null ? voucher.getUsedCount() : 0) + 1);
        voucherRepository.save(voucher);

        VoucherUsage usage = VoucherUsage.builder()
                .voucher(voucher)
                .user(user)
                .order(order)
                .discountAmount(discountAmount != null ? discountAmount : BigDecimal.ZERO)
                .usedAt(LocalDateTime.now())
                .build();
        voucherUsageRepository.save(usage);
        log.info("Đã ghi nhận sử dụng voucher: VoucherCode={}, UserID={}, OrderID={}, Discount={}",
                voucher.getCode(), user.getId(), order.getId(), discountAmount);
    }

    @Override
    @Transactional
    public void refundVoucherUsage(Order order) {
        if (order == null || order.getVoucher() == null) {
            return;
        }

        Voucher voucher = voucherRepository.findByCodeWithLock(order.getVoucher().getCode())
                .orElse(order.getVoucher());

        if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
            voucher.setUsedCount(voucher.getUsedCount() - 1);
            voucherRepository.save(voucher);
            log.info("Đã hoàn lại 1 lượt dùng cho voucher Code={} do đơn hàng ID={} bị hủy",
                    voucher.getCode(), order.getId());
        }

        voucherUsageRepository.deleteByOrderId(order.getId());
    }

    private void validateVoucherRules(Voucher voucher, BigDecimal subtotal, Long userId) {
        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            throw new AppException("Mã giảm giá '" + voucher.getCode() + "' hiện không hoạt động hoặc đã bị tạm dừng!", HttpStatus.BAD_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new AppException("Mã giảm giá '" + voucher.getCode() + "' chưa tới thời gian áp dụng!", HttpStatus.BAD_REQUEST);
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            throw new AppException("Mã giảm giá '" + voucher.getCode() + "' đã hết hạn sử dụng!", HttpStatus.BAD_REQUEST);
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new AppException("Mã giảm giá '" + voucher.getCode() + "' đã hết lượt sử dụng!", HttpStatus.BAD_REQUEST);
        }

        if (subtotal != null && voucher.getMinOrderValue() != null
                && subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new AppException("Đơn hàng chưa đạt giá trị tối thiểu "
                    + voucher.getMinOrderValue().toPlainString() + "đ để áp dụng mã này!", HttpStatus.BAD_REQUEST);
        }

        if (userId != null && voucher.getPerUserLimit() != null) {
            long usedCountByUser = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), userId);
            if (usedCountByUser >= voucher.getPerUserLimit()) {
                throw new AppException("Bạn đã sử dụng hết lượt cho mã giảm giá '" + voucher.getCode() + "'!", HttpStatus.BAD_REQUEST);
            }
        }
    }

    private void validateVoucherDatesAndValues(LocalDateTime startDate, LocalDateTime endDate,
                                               DiscountType discountType, BigDecimal discountValue) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new AppException("Ngày kết thúc phải diễn ra sau ngày bắt đầu!", HttpStatus.BAD_REQUEST);
        }

        if (discountType == DiscountType.PERCENTAGE) {
            if (discountValue.compareTo(BigDecimal.ZERO) <= 0 || discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new AppException("Tỷ lệ giảm giá phần trăm phải nằm trong khoảng từ 0.01% đến 100%!", HttpStatus.BAD_REQUEST);
            }
        }
    }
}

