package com.funnyshop.service;

import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    @DisplayName("getAllCategories - Lấy danh sách thành công và map đúng sang DTO")
    void getAllCategories_Success() {
        Category cat1 = Category.builder().id(1L).name("Thời trang").description("Mô tả 1").build();
        Category cat2 = Category.builder().id(2L).name("Điện tử").description("Mô tả 2").build();

        when(categoryRepository.findAll()).thenReturn(List.of(cat1, cat2));

        List<CategoryResponse> result = categoryService.getAllCategories();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Thời trang", result.get(0).getName());
        assertEquals("Điện tử", result.get(1).getName());
        verify(categoryRepository, times(1)).findAll();
    }
}

