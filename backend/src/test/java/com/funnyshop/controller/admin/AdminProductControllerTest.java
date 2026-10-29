package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.ProductCreateRequest;
import com.funnyshop.dto.request.ProductUpdateRequest;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.service.ProductService;
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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private AdminProductController adminProductController;

    private ProductResponse sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminProductController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleResponse = ProductResponse.builder()
                .id(1L)
                .name("Sản phẩm mới")
                .price(new BigDecimal("200000.00"))
                .stockQuantity(15)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/admin/products - Thêm mới sản phẩm thành công trả 201 Created")
    void createProduct_Success() throws Exception {
        when(productService.createProduct(any(ProductCreateRequest.class))).thenReturn(sampleResponse);

        String json = """
            {
                "name": "Sản phẩm mới",
                "description": "Mô tả",
                "price": 200000.00,
                "stockQuantity": 15,
                "categoryId": 1
            }
            """;

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(201)))
                .andExpect(jsonPath("$.message", is("Thêm mới sản phẩm thành công!")))
                .andExpect(jsonPath("$.data.id", is(1)));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/products/{id} - Cập nhật sản phẩm thành công trả 200 OK")
    void updateProduct_Success() throws Exception {
        when(productService.updateProduct(eq(1L), any(ProductUpdateRequest.class))).thenReturn(sampleResponse);

        String json = """
            {
                "name": "Sản phẩm sửa",
                "price": 250000.00,
                "stockQuantity": 20,
                "categoryId": 1
            }
            """;

        mockMvc.perform(put("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Cập nhật sản phẩm thành công!")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/products/{id} - Ẩn/xóa mềm sản phẩm thành công")
    void deleteProduct_Success() throws Exception {
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Ẩn/xóa mềm sản phẩm thành công!")));

        verify(productService, times(1)).deleteProduct(1L);
    }
}
