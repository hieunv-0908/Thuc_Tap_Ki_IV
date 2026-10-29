package com.funnyshop.service;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = Category.builder()
                .id(1L)
                .name("Thời trang")
                .description("Quần áo thời trang")
                .isDeleted(false)
                .build();
    }

    @Test
    @DisplayName("getAllCategories - Chỉ lấy các danh mục chưa bị xóa mềm")
    void getAllCategories_Success() {
        Category cat2 = Category.builder().id(2L).name("Điện tử").isDeleted(false).build();
        when(categoryRepository.findAllByIsDeletedFalse()).thenReturn(List.of(sampleCategory, cat2));

        List<CategoryResponse> result = categoryService.getAllCategories();

        assertEquals(2, result.size());
        assertEquals("Thời trang", result.get(0).getName());
        verify(categoryRepository).findAllByIsDeletedFalse();
    }

    @Test
    @DisplayName("createCategory - Tạo danh mục mới thành công")
    void createCategory_Success() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Đồ chơi")
                .description("Đồ chơi trẻ em")
                .build();

        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> {
            Category c = i.getArgument(0);
            c.setId(5L);
            return c;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertNotNull(response);
        assertEquals(5L, response.getId());
        assertEquals("Đồ chơi", response.getName());
    }

    @Test
    @DisplayName("updateCategory - Cập nhật danh mục thành công")
    void updateCategory_Success() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Thời trang Nam Nữ")
                .description("Mô tả mới")
                .build();

        when(categoryRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        CategoryResponse response = categoryService.updateCategory(1L, request);

        assertNotNull(response);
        assertEquals("Thời trang Nam Nữ", response.getName());
    }

    @Test
    @DisplayName("deleteCategory - Xóa mềm danh mục (isDeleted = true)")
    void deleteCategory_SoftDelete_Success() {
        when(categoryRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        categoryService.deleteCategory(1L);

        assertTrue(sampleCategory.getIsDeleted());
        verify(categoryRepository).save(sampleCategory);
    }
}

