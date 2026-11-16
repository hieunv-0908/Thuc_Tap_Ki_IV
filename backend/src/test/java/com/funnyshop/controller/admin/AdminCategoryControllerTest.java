package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.CategoryRequest;
import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminCategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private AdminCategoryController adminCategoryController;

    private CategoryResponse sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminCategoryController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleResponse = CategoryResponse.builder()
                .id(1L)
                .name("Đồ gia dụng")
                .description("Thiết bị gia dụng")
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/admin/categories - Thêm mới danh mục thành công trả 201 Created")
    void createCategory_Success() throws Exception {
        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(sampleResponse);

        String json = """
            {
                "name": "Đồ gia dụng",
                "description": "Thiết bị gia dụng"
            }
            """;

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(201)))
                .andExpect(jsonPath("$.message", is("Thêm mới danh mục thành công!")))
                .andExpect(jsonPath("$.data.name", is("Đồ gia dụng")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/categories/{id} - Cập nhật danh mục thành công")
    void updateCategory_Success() throws Exception {
        when(categoryService.updateCategory(eq(1L), any(CategoryRequest.class))).thenReturn(sampleResponse);

        String json = """
            {
                "name": "Đồ gia dụng thông minh"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Cập nhật danh mục thành công!")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/categories/{id} - Ẩn/xóa mềm danh mục thành công")
    void deleteCategory_Success() throws Exception {
        doNothing().when(categoryService).deleteCategory(1L);

        mockMvc.perform(delete("/api/v1/admin/categories/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Ẩn/xóa mềm danh mục thành công!")));

        verify(categoryService, times(1)).deleteCategory(1L);
    }

    @Test
    @DisplayName("GET /api/v1/admin/categories - Lấy tất cả danh mục cho Admin")
    void getAllCategories_Success() throws Exception {
        when(categoryService.getAllCategoriesForAdmin()).thenReturn(java.util.List.of(sampleResponse));

        mockMvc.perform(get("/api/v1/admin/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data[0].name", is("Đồ gia dụng")));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/categories/{id}/restore - Khôi phục danh mục thành công")
    void restoreCategory_Success() throws Exception {
        when(categoryService.restoreCategory(1L)).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/v1/admin/categories/1/restore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Khôi phục danh mục thành công!")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/categories/{id}/permanent - Xóa vĩnh viễn danh mục thành công")
    void hardDeleteCategory_Success() throws Exception {
        doNothing().when(categoryService).hardDeleteCategory(1L);

        mockMvc.perform(delete("/api/v1/admin/categories/1/permanent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Xóa vĩnh viễn danh mục thành công!")));
    }
}
