package com.funnyshop.service;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    List<CategoryResponse> getAllCategoriesForAdmin();
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
    void hardDeleteCategory(Long id);
    // Khôi phục danh mục đã xóa mềm
    CategoryResponse restoreCategory(Long id);
}