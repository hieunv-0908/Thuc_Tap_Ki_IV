package com.funnyshop.service.impl;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
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
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CategoryResponse> getAllCategoriesForAdmin() {
        List<Category> allCategories = categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        return allCategories.stream()
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
        return CategoryResponse.fromEntity(savedCategory, 0L);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());

        Category updatedCategory = categoryRepository.save(category);
        long productCount = productRepository.countByCategoryId(id);
        return CategoryResponse.fromEntity(updatedCategory, productCount);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        if (Boolean.TRUE.equals(category.getIsDeleted())) {
            return; // Đã bị ẩn trước đó
        }

        // Ràng buộc nghiệp vụ: Nếu danh mục còn sản phẩm liên kết thì KHÔNG ĐƯỢC ẨN / XÓA
        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new IllegalStateException(
                    "Không thể ẩn danh mục này vì vẫn còn " + productCount
                    + " sản phẩm đang liên kết. Vui lòng chuyển các sản phẩm sang danh mục khác trước khi ẩn danh mục!"
            );
        }

        category.setIsDeleted(true);
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void hardDeleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        // Ràng buộc nghiệp vụ: Nếu danh mục còn sản phẩm liên kết thì KHÔNG ĐƯỢC XÓA VĨNH VIỄN
        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new IllegalStateException(
                    "Không thể xóa vĩnh viễn danh mục này vì vẫn còn " + productCount
                    + " sản phẩm đang liên kết. Vui lòng chuyển hoặc xóa các sản phẩm sang danh mục khác trước!"
            );
        }

        categoryRepository.delete(category);
    }

    // Khôi phục danh mục đã xóa mềm
    @Override
    @Transactional
    public CategoryResponse restoreCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + id
                        )
                );

        // Khôi phục trạng thái danh mục
        category.setIsDeleted(false);
        Category restoredCategory = categoryRepository.save(category);
        long productCount = productRepository.countByCategoryId(id);
        return CategoryResponse.fromEntity(restoredCategory, productCount);
    }
}