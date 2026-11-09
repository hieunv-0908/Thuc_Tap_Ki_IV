package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/categories", "/api/v1/categories"})
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();

        ApiResponse<List<CategoryResponse>> response =
                ApiResponse.<List<CategoryResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách danh mục thành công!")
                        .data(categories)
                        .build();

        return ResponseEntity.ok(response);
    }

    // API khôi phục danh mục
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<CategoryResponse>> restoreCategory(
            @PathVariable Long id
    ) {
        CategoryResponse category = categoryService.restoreCategory(id);

        ApiResponse<CategoryResponse> response =
                ApiResponse.<CategoryResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Khôi phục danh mục thành công!")
                        .data(category)
                        .build();

        return ResponseEntity.ok(response);
    }
}