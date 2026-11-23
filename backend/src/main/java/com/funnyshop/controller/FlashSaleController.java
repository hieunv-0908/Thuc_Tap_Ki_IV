package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.FlashSaleResponse;
import com.funnyshop.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/flash-sales")
@RequiredArgsConstructor
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<FlashSaleResponse>> getActiveFlashSale() {
        Optional<FlashSaleResponse> activeOpt = flashSaleService.getActiveFlashSale();
        return ResponseEntity.ok(
                ApiResponse.success(
                        activeOpt.orElse(null),
                        activeOpt.isPresent() ? "Lấy chiến dịch Flash Sale đang diễn ra thành công" : "Hiện không có chiến dịch Flash Sale nào đang chạy"
                )
        );
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<java.util.List<FlashSaleResponse>>> getUpcomingFlashSales() {
        java.util.List<FlashSaleResponse> upcoming = flashSaleService.getUpcomingFlashSales();
        return ResponseEntity.ok(
                ApiResponse.success(upcoming, "Lấy danh sách Flash Sale sắp diễn ra thành công")
        );
    }
}

