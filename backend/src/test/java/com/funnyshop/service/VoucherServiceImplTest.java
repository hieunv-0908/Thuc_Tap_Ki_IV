package com.funnyshop.service;

import com.funnyshop.dto.request.VoucherCreateRequest;
import com.funnyshop.dto.request.VoucherUpdateRequest;
import com.funnyshop.dto.response.VoucherApplyResponse;
import com.funnyshop.dto.response.VoucherResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.User;
import com.funnyshop.entity.Voucher;
import com.funnyshop.enums.DiscountType;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceAlreadyExistsException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.VoucherRepository;
import com.funnyshop.repository.VoucherUsageRepository;
import com.funnyshop.service.impl.VoucherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherServiceImplTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private VoucherUsageRepository voucherUsageRepository;

    @InjectMocks
    private VoucherServiceImpl voucherService;

    private Voucher percentVoucher;
    private Voucher fixedVoucher;

    @BeforeEach
    void setUp() {
        percentVoucher = Voucher.builder()
                .id(1L)
                .code("SALE10")
                .name("Giảm 10% tối đa 50k")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .maxDiscountAmount(BigDecimal.valueOf(50000))
                .minOrderValue(BigDecimal.valueOf(200000))
                .usageLimit(100)
                .usedCount(5)
                .perUserLimit(1)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .isActive(true)
                .build();

        fixedVoucher = Voucher.builder()
                .id(2L)
                .code("GIAM30K")
                .name("Giảm thẳng 30k")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(30000))
                .minOrderValue(BigDecimal.valueOf(100000))
                .usageLimit(50)
                .usedCount(10)
                .perUserLimit(2)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("calculateDiscount: PERCENTAGE không vượt quá maxDiscountAmount")
    void testCalculateDiscountPercentageNormal() {
        // Đơn 400.000đ, giảm 10% = 40.000đ (dưới trần 50k)
        BigDecimal discount = voucherService.calculateDiscount(percentVoucher, BigDecimal.valueOf(400000));
        assertEquals(0, BigDecimal.valueOf(40000).compareTo(discount));
    }

    @Test
    @DisplayName("calculateDiscount: PERCENTAGE vượt quá maxDiscountAmount bị chặn trần")
    void testCalculateDiscountPercentageCapped() {
        // Đơn 1.000.000đ, 10% = 100k -> chặn lại còn 50k
        BigDecimal discount = voucherService.calculateDiscount(percentVoucher, BigDecimal.valueOf(1000000));
        assertEquals(0, BigDecimal.valueOf(50000).compareTo(discount));
    }

    @Test
    @DisplayName("calculateDiscount: FIXED_AMOUNT giảm đúng số tiền cố định")
    void testCalculateDiscountFixed() {
        BigDecimal discount = voucherService.calculateDiscount(fixedVoucher, BigDecimal.valueOf(200000));
        assertEquals(0, BigDecimal.valueOf(30000).compareTo(discount));
    }

    @Test
    @DisplayName("calculateDiscount: FIXED_AMOUNT không vượt quá subtotal nếu subtotal nhỏ hơn discount")
    void testCalculateDiscountFixedSubtotalCap() {
        BigDecimal discount = voucherService.calculateDiscount(fixedVoucher, BigDecimal.valueOf(20000));
        assertEquals(0, BigDecimal.valueOf(20000).compareTo(discount));
    }

    @Test
    @DisplayName("applyVoucher: Thành công khi thỏa mãn toàn bộ điều kiện")
    void testApplyVoucherSuccess() {
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 100L)).thenReturn(0L);

        VoucherApplyResponse response = voucherService.applyVoucher("SALE10", BigDecimal.valueOf(400000), 100L);

        assertTrue(response.isValid());
        assertEquals("SALE10", response.getVoucherCode());
        assertEquals(0, BigDecimal.valueOf(40000).compareTo(response.getDiscountAmount()));
        assertEquals(0, BigDecimal.valueOf(360000).compareTo(response.getFinalAmount()));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi mã không tồn tại")
    void testApplyVoucherNotFound() {
        when(voucherRepository.findByCodeIgnoreCase("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                voucherService.applyVoucher("UNKNOWN", BigDecimal.valueOf(300000), 100L));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi mã đã ngừng kích hoạt")
    void testApplyVoucherInactive() {
        percentVoucher.setIsActive(false);
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));

        AppException ex = assertThrows(AppException.class, () ->
                voucherService.applyVoucher("SALE10", BigDecimal.valueOf(300000), 100L));
        assertTrue(ex.getMessage().contains("không hoạt động"));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi mã đã hết hạn")
    void testApplyVoucherExpired() {
        percentVoucher.setEndDate(LocalDateTime.now().minusDays(1));
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));

        AppException ex = assertThrows(AppException.class, () ->
                voucherService.applyVoucher("SALE10", BigDecimal.valueOf(300000), 100L));
        assertTrue(ex.getMessage().contains("hết hạn"));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi chưa tới ngày áp dụng")
    void testApplyVoucherFuture() {
        percentVoucher.setStartDate(LocalDateTime.now().plusDays(2));
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));

        AppException ex = assertThrows(AppException.class, () ->
                voucherService.applyVoucher("SALE10", BigDecimal.valueOf(300000), 100L));
        assertTrue(ex.getMessage().contains("chưa tới thời gian"));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi đơn hàng chưa đạt giá trị tối thiểu")
    void testApplyVoucherMinOrderValue() {
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));

        // percentVoucher yêu cầu min 200.000đ, truyền 150.000đ
        AppException ex = assertThrows(AppException.class, () ->
                voucherService.applyVoucher("SALE10", BigDecimal.valueOf(150000), 100L));
        assertTrue(ex.getMessage().contains("chưa đạt giá trị tối thiểu"));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi mã đã hết tổng lượt sử dụng")
    void testApplyVoucherUsageLimitReached() {
        percentVoucher.setUsedCount(100);
        percentVoucher.setUsageLimit(100);
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));

        AppException ex = assertThrows(AppException.class, () ->
                voucherService.applyVoucher("SALE10", BigDecimal.valueOf(300000), 100L));
        assertTrue(ex.getMessage().contains("hết lượt"));
    }

    @Test
    @DisplayName("applyVoucher: Thất bại khi khách đã dùng hết lượt cá nhân (perUserLimit)")
    void testApplyVoucherPerUserLimitReached() {
        when(voucherRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(percentVoucher));
        when(voucherUsageRepository.countByVoucherIdAndUserId(1L, 100L)).thenReturn(1L);

        AppException ex = assertThrows(AppException.class, () ->
                voucherService.applyVoucher("SALE10", BigDecimal.valueOf(300000), 100L));
        assertTrue(ex.getMessage().contains("hết lượt cho mã giảm giá"));
    }

    @Test
    @DisplayName("createVoucher: Thất bại khi trùng mã code")
    void testCreateVoucherDuplicateCode() {
        when(voucherRepository.existsByCodeIgnoreCase("SALE10")).thenReturn(true);

        VoucherCreateRequest req = VoucherCreateRequest.builder()
                .code("SALE10")
                .name("Test duplicate")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(5))
                .build();

        assertThrows(ResourceAlreadyExistsException.class, () -> voucherService.createVoucher(req));
    }

    @Test
    @DisplayName("createVoucher: Thành công khi dữ liệu hợp lệ")
    void testCreateVoucherSuccess() {
        when(voucherRepository.existsByCodeIgnoreCase("NEWCODE")).thenReturn(false);
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(i -> {
            Voucher v = i.getArgument(0);
            v.setId(99L);
            return v;
        });

        VoucherCreateRequest req = VoucherCreateRequest.builder()
                .code("newcode")
                .name("New Voucher")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(20000))
                .minOrderValue(BigDecimal.valueOf(100000))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(5))
                .perUserLimit(1)
                .build();

        VoucherResponse res = voucherService.createVoucher(req);
        assertNotNull(res);
        assertEquals("NEWCODE", res.getCode());
    }

    @Test
    @DisplayName("toggleVoucherStatus: Đảo ngược trạng thái isActive thành công")
    void testToggleVoucherStatus() {
        when(voucherRepository.findById(1L)).thenReturn(Optional.of(percentVoucher));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(i -> i.getArgument(0));

        VoucherResponse res = voucherService.toggleVoucherStatus(1L);
        assertFalse(res.getIsActive());

        res = voucherService.toggleVoucherStatus(1L);
        assertTrue(res.getIsActive());
    }
}
