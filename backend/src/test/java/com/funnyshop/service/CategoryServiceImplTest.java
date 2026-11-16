package com.funnyshop.service;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

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

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));
        when(productRepository.countByCategoryId(1L)).thenReturn(2L);

        CategoryResponse response = categoryService.updateCategory(1L, request);

        assertNotNull(response);
        assertEquals("Thời trang Nam Nữ", response.getName());
        assertEquals(2L, response.getProductCount());
    }

    @Test
    @DisplayName("deleteCategory - Xóa mềm danh mục thành công khi không có sản phẩm liên kết")
    void deleteCategory_SoftDelete_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.countByCategoryId(1L)).thenReturn(0L);
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        categoryService.deleteCategory(1L);

        assertTrue(sampleCategory.getIsDeleted());
        verify(categoryRepository).save(sampleCategory);
    }

    @Test
    @DisplayName("deleteCategory - Chặn xóa mềm khi danh mục vẫn còn sản phẩm liên kết")
    void deleteCategory_HasProducts_ThrowsException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.countByCategoryId(1L)).thenReturn(5L);

        assertThrows(IllegalStateException.class, () -> categoryService.deleteCategory(1L));

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    @DisplayName("hardDeleteCategory - Xóa vĩnh viễn khi không còn sản phẩm liên kết")
    void hardDeleteCategory_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.countByCategoryId(1L)).thenReturn(0L);

        categoryService.hardDeleteCategory(1L);

        verify(categoryRepository).hardDeleteById(1L);
    }

    @Test
    @DisplayName("hardDeleteCategory - Chặn xóa vĩnh viễn và bảo toàn dữ liệu khi còn sản phẩm liên kết")
    void hardDeleteCategory_HasProducts_ThrowsException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.countByCategoryId(1L)).thenReturn(4L);

        assertThrows(IllegalStateException.class, () -> categoryService.hardDeleteCategory(1L));

        verify(categoryRepository, never()).hardDeleteById(anyLong());
    }

    @Test
    @DisplayName("getAllCategoriesForAdmin - Trả về đầy đủ danh mục kèm số lượng sản phẩm")
    void getAllCategoriesForAdmin_Success() {
        when(categoryRepository.findAll(any(Sort.class))).thenReturn(List.of(sampleCategory));
        when(productRepository.countByCategoryId(1L)).thenReturn(8L);

        List<CategoryResponse> result = categoryService.getAllCategoriesForAdmin();

        assertEquals(1, result.size());
        assertEquals(8L, result.get(0).getProductCount());
    }
}

