package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.*;
import com.funnyshop.dto.response.ProductImageResponse;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.dto.response.ProductVariantResponse;
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

    @InjectMocks
    private AdminVariantImageController adminVariantImageController;

    private ProductResponse sampleResponse;
    private ProductVariantResponse sampleVariantResponse;
    private ProductImageResponse sampleImageResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminProductController, adminVariantImageController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleResponse = ProductResponse.builder()
                .id(1L)
                .name("Sản phẩm mới")
                .price(new BigDecimal("200000.00"))
                .stockQuantity(15)
                .isDeleted(false)
                .build();

        sampleVariantResponse = ProductVariantResponse.builder()
                .id(10L)
                .productId(1L)
                .sku("SKU-1-BLK-M")
                .color("Black")
                .size("M")
                .price(new BigDecimal("250000.00"))
                .stockQuantity(30)
                .isDeleted(false)
                .build();

        sampleImageResponse = ProductImageResponse.builder()
                .id(50L)
                .productId(1L)
                .imageUrl("https://example.com/img.jpg")
                .isPrimary(true)
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
                "categoryId": 1,
                "isDeleted": false
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
                .andExpect(jsonPath("$.message", is("Ẩn/xóa mềm sản phẩm và toàn bộ biến thể thành công!")));

        verify(productService, times(1)).deleteProduct(1L);
    }

    @Test
    @DisplayName("PUT /api/v1/admin/products/{id}/restore - Khôi phục sản phẩm thành công")
    void restoreProduct_Success() throws Exception {
        when(productService.restoreProduct(1L)).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/v1/admin/products/1/restore")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Khôi phục sản phẩm và toàn bộ biến thể thành công!")));

        verify(productService, times(1)).restoreProduct(1L);
    }

    @Test
    @DisplayName("POST /api/v1/admin/products/{productId}/variants - Thêm mới biến thể thành công")
    void addVariant_Success() throws Exception {
        when(productService.addVariant(eq(1L), any(ProductVariantCreateRequest.class))).thenReturn(sampleVariantResponse);

        String json = """
            {
                "sku": "SKU-1-BLK-M",
                "color": "Black",
                "size": "M",
                "price": 250000.00,
                "stockQuantity": 30
            }
            """;

        mockMvc.perform(post("/api/v1/admin/products/1/variants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(201)))
                .andExpect(jsonPath("$.message", is("Thêm mới biến thể thành công!")))
                .andExpect(jsonPath("$.data.id", is(10)))
                .andExpect(jsonPath("$.data.sku", is("SKU-1-BLK-M")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/variants/{variantId} - Cập nhật biến thể thành công")
    void updateVariant_Success() throws Exception {
        when(productService.updateVariant(eq(10L), any(ProductVariantUpdateRequest.class))).thenReturn(sampleVariantResponse);

        String json = """
            {
                "sku": "SKU-1-BLK-M",
                "color": "Black",
                "size": "M",
                "price": 260000.00,
                "stockQuantity": 35
            }
            """;

        mockMvc.perform(put("/api/v1/admin/variants/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Cập nhật biến thể thành công!")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/variants/{variantId} - Xóa biến thể thành công")
    void deleteVariant_Success() throws Exception {
        doNothing().when(productService).deleteVariant(10L);

        mockMvc.perform(delete("/api/v1/admin/variants/10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Ẩn/ngừng kinh doanh biến thể thành công!")));

        verify(productService, times(1)).deleteVariant(10L);
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/variants/{variantId}/restore - Khôi phục biến thể thành công")
    void restoreVariant_Success() throws Exception {
        when(productService.restoreVariant(10L)).thenReturn(sampleVariantResponse);

        mockMvc.perform(patch("/api/v1/admin/variants/10/restore")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Khôi phục biến thể thành công!")));
    }

    @Test
    @DisplayName("POST /api/v1/admin/products/{productId}/images - Thêm ảnh thành công")
    void addImage_Success() throws Exception {
        when(productService.addImage(eq(1L), any(ProductImageCreateRequest.class))).thenReturn(sampleImageResponse);

        String json = """
            {
                "imageUrl": "https://example.com/img.jpg",
                "isPrimary": true
            }
            """;

        mockMvc.perform(post("/api/v1/admin/products/1/images")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(201)))
                .andExpect(jsonPath("$.message", is("Thêm hình ảnh cho sản phẩm thành công!")));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/images/{imageId}/primary - Đặt ảnh đại diện chính thành công")
    void setPrimaryImage_Success() throws Exception {
        when(productService.setPrimaryImage(50L)).thenReturn(sampleImageResponse);

        mockMvc.perform(patch("/api/v1/admin/images/50/primary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Đặt làm ảnh đại diện chính thành công!")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/images/{imageId} - Xóa ảnh thành công")
    void deleteImage_Success() throws Exception {
        doNothing().when(productService).deleteImage(50L);

        mockMvc.perform(delete("/api/v1/admin/images/50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Xóa hình ảnh thành công!")));

        verify(productService, times(1)).deleteImage(50L);
    }
}
