package com.funnyshop.service.impl;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByIsDeletedFalse().stream()
                .map(cat -> {
                    long productCount = productRepository.countByCategoryIdAndIsDeletedFalse(cat.getId());
                    return CategoryResponse.fromEntity(cat, productCount);
                })
                .toList();
    }

    @Override
    public List<CategoryResponse> getAllCategoriesAdmin() {
        return categoryRepository.findAllByOrderByIdAsc().stream()
                .map(cat -> {
                    long productCount = productRepository.countByCategoryId(cat.getId());
                    return CategoryResponse.fromEntity(cat, productCount);
                })
                .toList();
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .isDeleted(false)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(savedCategory);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());

        Category updatedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        long activeProducts = productRepository.countByCategoryIdAndIsDeletedFalse(id);
        long totalProducts = productRepository.countByCategoryId(id);

        if (activeProducts > 0 || totalProducts > 0) {
            long count = activeProducts > 0 ? activeProducts : totalProducts;
            throw new IllegalArgumentException(
                    "Không thể ẩn hoặc xóa danh mục '" + category.getName() + "' vì vẫn còn " + count +
                    " sản phẩm đang liên kết. Vui lòng chuyển các sản phẩm sang danh mục khác hoặc dừng bán chúng trước khi xóa."
            );
        }

        category.setIsDeleted(true);
        categoryRepository.save(category);
    }

    // Khôi phục danh mục đã xóa mềm
    @Override
    @Transactional
    public CategoryResponse restoreCategory(Long id) {

        // Dùng findById để tìm cả danh mục đã bị xóa mềm
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        // Khôi phục trạng thái danh mục
        category.setIsDeleted(false);

        Category restoredCategory = categoryRepository.save(category);

        return CategoryResponse.fromEntity(restoredCategory);
    }
}