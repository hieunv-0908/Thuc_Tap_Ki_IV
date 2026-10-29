package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/products", "/api/v1/products"})
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @PathVariable Long id) {

        ProductResponse product = productService.getProductById(id);

        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy chi tiết sản phẩm thành công!")
                .data(product)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String effectiveKeyword = (keyword != null && !keyword.isBlank()) ? keyword : q;

        String effectiveSortBy = sortBy;
        String effectiveSortDir = sortDir;

        // Hỗ trợ tham số sort tổng hợp nếu client truyền dạng "price_asc", "stock_desc", "asc", "price,asc"
        if (sort != null && !sort.isBlank()) {
            String s = sort.trim().toLowerCase();
            if (s.contains("_")) {
                String[] parts = s.split("_", 2);
                effectiveSortBy = parts[0];
                effectiveSortDir = parts[1];
            } else if (s.contains(",")) {
                String[] parts = s.split(",", 2);
                effectiveSortBy = parts[0];
                effectiveSortDir = parts[1];
            } else if ("asc".equalsIgnoreCase(s) || "desc".equalsIgnoreCase(s)) {
                effectiveSortBy = "price";
                effectiveSortDir = s;
            }
        }

        Page<ProductResponse> products = productService.getProducts(
                effectiveKeyword, categoryId, effectiveSortBy, effectiveSortDir, page, size
        );

        return ResponseEntity.ok(
                ApiResponse.<Page<ProductResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách sản phẩm thành công!")
                        .data(products)
                        .build()
        );
    }
}
