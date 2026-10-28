package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.entity.Product;
import com.funnyshop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class productController {

    private final ProductService productService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(
            @PathVariable Long id) {

        Product product = productService.getProductById(id);

        ApiResponse<Product> response = ApiResponse.<Product>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy chi tiết sản phẩm thành công!")
                .data(product)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Product>>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<Product> products = productService.getProducts(
                keyword, categoryId, sort, page, size
        );

        return ResponseEntity.ok(
                ApiResponse.<Page<Product>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách sản phẩm thành công!")
                        .data(products)
                        .build()
        );
    }
}
