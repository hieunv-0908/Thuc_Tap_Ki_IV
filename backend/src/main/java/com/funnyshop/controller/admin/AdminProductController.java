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
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/v1/admin", "/api/admin" })
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    // ==========================================
    // PHẦN A: QUẢN LÝ SẢN PHẨM GỐC (Base Product)
    // ==========================================

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ProductResponse> products = productService.getAllProducts(
                keyword, categoryId, sortBy, sortDir, page, size);

        return ResponseEntity.ok(
                ApiResponse.<Page<ProductResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách tất cả sản phẩm thành công!")
                        .data(products)
                        .build());
    }

    @PostMapping("/products")
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

    @PutMapping("/products/{id}")
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

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Ẩn/xóa mềm sản phẩm và toàn bộ biến thể thành công!")
                        .build());
    }

    @PutMapping("/products/{id}/restore")
    public ResponseEntity<ApiResponse<ProductResponse>> restoreProductPut(@PathVariable Long id) {
        return restoreProduct(id);
    }

    @PatchMapping("/products/{id}/restore")
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
    // PHẦN B: QUẢN LÝ BIẾN THỂ (Product Variants)
    // ==========================================

    @PostMapping("/products/{productId}/variants")
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
    // PHẦN C: QUẢN LÝ HÌNH ẢNH (Product Images)
    // ==========================================

    @PostMapping("/products/{productId}/images")
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
