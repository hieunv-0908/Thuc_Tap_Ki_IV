package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin/categories", "/api/admin/categories"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategoriesForAdmin();

        return ResponseEntity.ok(
                ApiResponse.<List<CategoryResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách tất cả danh mục thành công!")
                        .data(categories)
                        .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request) {

        CategoryResponse response = categoryService.createCategory(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CategoryResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Thêm mới danh mục thành công!")
                        .data(response)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {

        CategoryResponse response = categoryService.updateCategory(id, request);

        return ResponseEntity.ok(
                ApiResponse.<CategoryResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật danh mục thành công!")
                        .data(response)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Ẩn/xóa mềm danh mục thành công!")
                        .build());
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<CategoryResponse>> restoreCategory(@PathVariable Long id) {
        CategoryResponse response = categoryService.restoreCategory(id);

        return ResponseEntity.ok(
                ApiResponse.<CategoryResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Khôi phục danh mục thành công!")
                        .data(response)
                        .build());
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<Void>> hardDeleteCategory(@PathVariable Long id) {
        categoryService.hardDeleteCategory(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xóa vĩnh viễn danh mục thành công!")
                        .build());
    }
}

