package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.ProductCreateRequest;
import com.funnyshop.dto.request.ProductImageCreateRequest;
import com.funnyshop.dto.request.ProductUpdateRequest;
import com.funnyshop.dto.request.ProductVariantCreateRequest;
import com.funnyshop.dto.request.ProductVariantUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ProductImageResponse;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.dto.response.ProductVariantResponse;
import com.funnyshop.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/v1/admin/products", "/api/admin/products" })
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    // ==========================================
    // BASE PRODUCT MANAGEMENT
    // ==========================================

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request) {

        ProductResponse response = productService.createProduct(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Thêm mới sản phẩm thành công!")
                        .data(response)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {

        ProductResponse response = productService.updateProduct(id, request);

        return ResponseEntity.ok(
                ApiResponse.<ProductResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật sản phẩm thành công!")
                        .data(response)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Ẩn/xóa mềm sản phẩm và toàn bộ biến thể thành công!")
                        .build());
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ProductResponse>> restoreProductPut(@PathVariable Long id) {
        return restoreProduct(id);
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ProductResponse>> restoreProduct(@PathVariable Long id) {
        ProductResponse response = productService.restoreProduct(id);

        return ResponseEntity.ok(
                ApiResponse.<ProductResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Khôi phục sản phẩm và toàn bộ biến thể thành công!")
                        .data(response)
                        .build());
    }

    // ==========================================
    // VARIANT MANAGEMENT (nested under product)
    // ==========================================

    @PostMapping("/{productId}/variants")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> addVariant(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVariantCreateRequest request) {

        ProductVariantResponse response = productService.addVariant(productId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductVariantResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Thêm mới biến thể thành công!")
                        .data(response)
                        .build());
    }

    // ==========================================
    // IMAGE MANAGEMENT (nested under product)
    // ==========================================

    @PostMapping("/{productId}/images")
    public ResponseEntity<ApiResponse<ProductImageResponse>> addImage(
            @PathVariable Long productId,
            @Valid @RequestBody ProductImageCreateRequest request) {

        ProductImageResponse response = productService.addImage(productId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductImageResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Thêm hình ảnh cho sản phẩm thành công!")
                        .data(response)
                        .build());
    }
}
