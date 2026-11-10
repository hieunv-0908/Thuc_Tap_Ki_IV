package com.funnyshop.service;

import com.funnyshop.dto.request.ProductCreateRequest;
import com.funnyshop.dto.request.ProductUpdateRequest;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.ProductImage;
import com.funnyshop.entity.ProductVariant;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.repository.ProductImageRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.ProductVariantRepository;
import com.funnyshop.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product mockProduct;
    private Category mockCategory;
    private ProductVariant mockVariant;

    @BeforeEach
    void setUp() {
        mockCategory = Category.builder()
                .id(1L)
                .name("Thời trang Nam")
                .description("Quần áo nam")
                .isDeleted(false)
                .build();

        mockVariant = ProductVariant.builder()
                .id(1001L)
                .sku("SKU-100-M")
                .color("White")
                .size("M")
                .price(new BigDecimal("150000.00"))
                .stockQuantity(50)
                .isDeleted(false)
                .build();

        mockProduct = Product.builder()
                .id(100L)
                .name("Áo Thun Funny")
                .description("Áo cotton mềm mại")
                .category(mockCategory)
                .isDeleted(false)
                .variants(new ArrayList<>(List.of(mockVariant)))
                .images(new ArrayList<>())
                .build();

        mockVariant.setProduct(mockProduct);
    }

    @Test
    @DisplayName("getProductById - Tìm thấy sản phẩm chưa xóa trả về DTO")
    void getProductById_Success() {
        when(productRepository.findByIdWithCategory(100L)).thenReturn(Optional.of(mockProduct));

        ProductResponse response = productService.getProductById(100L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Áo Thun Funny", response.getName());
        assertEquals(50, response.getStockQuantity());
        assertEquals(50, response.getStock());
        assertFalse(response.getIsDeleted());
    }

    @Test
    @DisplayName("getProductById - Không tìm thấy ném ngoại lệ ResourceNotFoundException")
    void getProductById_NotFound() {
        when(productRepository.findByIdWithCategory(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(999L));
    }

    @Test
    @DisplayName("createProduct - Thêm mới sản phẩm hợp lệ thành công")
    void createProduct_Success() {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Sản phẩm mới")
                .description("Mô tả")
                .price(new BigDecimal("200000.00"))
                .stockQuantity(20)
                .categoryId(1L)
                .build();

        when(categoryRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mockCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> {
            Product p = i.getArgument(0);
            p.setId(101L);
            return p;
        });
        when(productVariantRepository.save(any(ProductVariant.class))).thenAnswer(i -> i.getArgument(0));

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Sản phẩm mới", response.getName());
        assertFalse(response.getIsDeleted());
        verify(productRepository).save(any(Product.class));
        verify(productVariantRepository).save(any(ProductVariant.class));
    }

    @Test
    @DisplayName("updateProduct - Cập nhật sản phẩm thành công")
    void updateProduct_Success() {
        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Áo Thun Funny v2")
                .description("Mô tả mới")
                .price(new BigDecimal("160000.00"))
                .stockQuantity(40)
                .categoryId(1L)
                .build();

        when(productRepository.findById(100L)).thenReturn(Optional.of(mockProduct));
        when(categoryRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mockCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        when(productVariantRepository.save(any(ProductVariant.class))).thenAnswer(i -> i.getArgument(0));

        ProductResponse response = productService.updateProduct(100L, request);

        assertNotNull(response);
        assertEquals("Áo Thun Funny v2", response.getName());
        assertEquals(new BigDecimal("160000.00"), response.getPrice());
    }

    @Test
    @DisplayName("updateProduct - Cập nhật kèm thay đổi trạng thái xóa mềm isDeleted")
    void updateProduct_WithIsDeleted_ToggleStatus() {
        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Áo Thun Funny v2")
                .price(new BigDecimal("160000.00"))
                .stockQuantity(40)
                .categoryId(1L)
                .isDeleted(true)
                .build();

        when(productRepository.findById(100L)).thenReturn(Optional.of(mockProduct));
        when(categoryRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mockCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        when(productVariantRepository.save(any(ProductVariant.class))).thenAnswer(i -> i.getArgument(0));

        ProductResponse response = productService.updateProduct(100L, request);

        assertNotNull(response);
        assertTrue(response.getIsDeleted());
        assertTrue(mockProduct.getIsDeleted());
    }

    @Test
    @DisplayName("deleteProduct - Xóa mềm sản phẩm (chuyển cờ isDeleted thành true)")
    void deleteProduct_SoftDelete_Success() {
        when(productRepository.findByIdAndIsDeletedFalse(100L)).thenReturn(Optional.of(mockProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        productService.deleteProduct(100L);

        assertTrue(mockProduct.getIsDeleted());
        verify(productRepository).save(mockProduct);
    }

    @Test
    @DisplayName("restoreProduct - Khôi phục sản phẩm đã xóa mềm (chuyển cờ isDeleted thành false)")
    void restoreProduct_Success() {
        mockProduct.setIsDeleted(true);
        when(productRepository.findById(100L)).thenReturn(Optional.of(mockProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        ProductResponse response = productService.restoreProduct(100L);

        assertNotNull(response);
        assertFalse(response.getIsDeleted());
        assertFalse(mockProduct.getIsDeleted());
        verify(productRepository).save(mockProduct);
    }

    @Test
    @DisplayName("getProducts - Sắp xếp theo tên và lọc bỏ bản ghi đã xóa")
    void getProducts_SortByName() {
        Page<Product> page = new PageImpl<>(List.of(mockProduct));
        when(productRepository.searchProducts(any(), any(), any(Pageable.class))).thenReturn(page);

        Page<ProductResponse> result = productService.getProducts("áo", 1L, "name", "desc", 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).searchProducts(eq("áo"), eq(1L), pageableCaptor.capture());

        Pageable captured = pageableCaptor.getValue();
        Sort.Order order = captured.getSort().getOrderFor("name");
        assertNotNull(order);
        assertTrue(order.isDescending());
    }
}
