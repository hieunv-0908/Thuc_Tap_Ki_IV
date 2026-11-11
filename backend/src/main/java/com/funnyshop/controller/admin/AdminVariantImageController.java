package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.ProductVariantUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ProductImageResponse;
import com.funnyshop.dto.response.ProductVariantResponse;
import com.funnyshop.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/v1/admin", "/api/admin" })
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminVariantImageController {

    private final ProductService productService;

    // ==========================================
    // VARIANT MANAGEMENT (standalone by variantId)
    // ==========================================

    @PutMapping("/variants/{variantId}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateVariant(
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantUpdateRequest request) {

        ProductVariantResponse response = productService.updateVariant(variantId, request);

        return ResponseEntity.ok(
                ApiResponse.<ProductVariantResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật biến thể thành công!")
                        .data(response)
                        .build());
    }

    @DeleteMapping("/variants/{variantId}")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable Long variantId) {
        productService.deleteVariant(variantId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Ẩn/ngừng kinh doanh biến thể thành công!")
                        .build());
    }

    @PatchMapping("/variants/{variantId}/restore")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> restoreVariant(@PathVariable Long variantId) {
        ProductVariantResponse response = productService.restoreVariant(variantId);

        return ResponseEntity.ok(
                ApiResponse.<ProductVariantResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Khôi phục biến thể thành công!")
                        .data(response)
                        .build());
    }

    // ==========================================
    // IMAGE MANAGEMENT (standalone by imageId)
    // ==========================================

    @PatchMapping("/images/{imageId}/primary")
    public ResponseEntity<ApiResponse<ProductImageResponse>> setPrimaryImage(@PathVariable Long imageId) {
        ProductImageResponse response = productService.setPrimaryImage(imageId);

        return ResponseEntity.ok(
                ApiResponse.<ProductImageResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đặt làm ảnh đại diện chính thành công!")
                        .data(response)
                        .build());
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long imageId) {
        productService.deleteImage(imageId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xóa hình ảnh thành công!")
                        .build());
    }
}

