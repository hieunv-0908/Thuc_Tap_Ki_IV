package com.funnyshop.service;

import com.funnyshop.dto.request.VoucherCreateRequest;
import com.funnyshop.dto.request.VoucherUpdateRequest;
import com.funnyshop.dto.response.VoucherApplyResponse;
import com.funnyshop.dto.response.VoucherResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.User;
import com.funnyshop.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface VoucherService {

    List<VoucherResponse> getAvailableVouchers(Long userId);

    VoucherApplyResponse applyVoucher(String code, BigDecimal subtotal, Long userId);

    Voucher validateAndGetVoucherForCheckout(String code, BigDecimal subtotal, Long userId);

    BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal);

    Page<VoucherResponse> getAllVouchers(String search, Boolean isActive, Pageable pageable);

    VoucherResponse getVoucherById(Long id);

    VoucherResponse createVoucher(VoucherCreateRequest request);

    VoucherResponse updateVoucher(Long id, VoucherUpdateRequest request);

    VoucherResponse toggleVoucherStatus(Long id);

    void deleteVoucher(Long id);

    void recordVoucherUsage(Voucher voucher, User user, Order order, BigDecimal discountAmount);

    void refundVoucherUsage(Order order);
}

