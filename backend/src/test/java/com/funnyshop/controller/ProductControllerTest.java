package com.funnyshop.controller;

import com.funnyshop.dto.response.CategoryResponse;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    private ProductResponse sampleProduct;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleProduct = ProductResponse.builder()
                .id(1L)
                .name("Tai nghe Bluetooth")
                .description("Mô tả chi tiết")
                .price(new BigDecimal("350000.00"))
                .stockQuantity(20)
                .stock(20)
                .category(CategoryResponse.builder().id(1L).name("Điện tử").build())
                .imageUrl("https://example.com/item.jpg")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} - Lấy chi tiết sản phẩm thành công trả 200 OK")
    void getProductById_Success() throws Exception {
        when(productService.getProductById(1L)).thenReturn(sampleProduct);

        mockMvc.perform(get("/api/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Lấy chi tiết sản phẩm thành công!")))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.name", is("Tai nghe Bluetooth")));
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} - Trả 404 Not Found đóng gói trong ApiResponse khi sản phẩm không tồn tại")
    void getProductById_NotFound() throws Exception {
        when(productService.getProductById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: 999"));

        mockMvc.perform(get("/api/v1/products/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is(404)))
                .andExpect(jsonPath("$.message", is("Không tìm thấy sản phẩm với ID: 999")));
    }

    @Test
    @DisplayName("GET /api/v1/products - Lấy danh sách phân trang và phân tách tham số sortBy & sortDir thành công")
    void getProducts_SuccessWithSortParams() throws Exception {
        when(productService.getProducts(eq("tai nghe"), eq(1L), eq("price"), eq("desc"), eq(0), eq(10)))
                .thenReturn(new PageImpl<>(List.of(sampleProduct), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/products")
                        .param("keyword", "tai nghe")
                        .param("categoryId", "1")
                        .param("sortBy", "price")
                        .param("sortDir", "desc")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.content[0].name", is("Tai nghe Bluetooth")));
    }
}

