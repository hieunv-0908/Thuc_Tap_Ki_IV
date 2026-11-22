package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.FlashSaleRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.FlashSaleResponse;
import com.funnyshop.service.FlashSaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/flash-sales")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFlashSaleController {

    private final FlashSaleService flashSaleService;

    @PostMapping
    public ResponseEntity<ApiResponse<FlashSaleResponse>> createFlashSale(@Valid @RequestBody FlashSaleRequest request) {
        FlashSaleResponse response = flashSaleService.createFlashSale(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo chiến dịch Flash Sale thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FlashSaleResponse>> updateFlashSale(
            @PathVariable Long id,
            @Valid @RequestBody FlashSaleRequest request) {
        FlashSaleResponse response = flashSaleService.updateFlashSale(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật chiến dịch Flash Sale thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFlashSale(@PathVariable Long id) {
        flashSaleService.deleteFlashSale(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa chiến dịch Flash Sale thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FlashSaleResponse>> getFlashSaleById(@PathVariable Long id) {
        FlashSaleResponse response = flashSaleService.getFlashSaleById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin Flash Sale thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FlashSaleResponse>>> getAllFlashSales() {
        List<FlashSaleResponse> response = flashSaleService.getAllFlashSales();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách Flash Sale thành công"));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<FlashSaleResponse>> toggleActive(@PathVariable Long id) {
        FlashSaleResponse response = flashSaleService.toggleFlashSaleActive(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái Flash Sale thành công"));
    }
}

