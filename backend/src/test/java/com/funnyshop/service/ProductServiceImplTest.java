package com.funnyshop.service;

import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.entity.Product;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Category mockCategory;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockCategory = Category.builder()
                .id(1L)
                .name("Thời trang")
                .description("Quần áo thời trang")
                .build();

        mockProduct = Product.builder()
                .id(100L)
                .name("Áo Thun Funny")
                .description("Áo cotton thoáng mát")
                .price(new BigDecimal("150000.00"))
                .stockQuantity(50)
                .category(mockCategory)
                .imageUrl("https://example.com/image.png")
                .build();
    }

    @Test
    @DisplayName("getProductById - Thành công khi ID tồn tại")
    void getProductById_Success() {
        when(productRepository.findByIdWithCategory(100L)).thenReturn(Optional.of(mockProduct));

        ProductResponse response = productService.getProductById(100L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Áo Thun Funny", response.getName());
        assertEquals(new BigDecimal("150000.00"), response.getPrice());
        assertEquals(50, response.getStockQuantity());
        assertEquals(50, response.getStock());
        assertNotNull(response.getCategory());
        assertEquals("Thời trang", response.getCategory().getName());
        verify(productRepository, times(1)).findByIdWithCategory(100L);
    }

    @Test
    @DisplayName("getProductById - Ném ResourceNotFoundException khi ID không tồn tại")
    void getProductById_NotFound() {
        when(productRepository.findByIdWithCategory(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> productService.getProductById(999L)
        );

        assertTrue(exception.getMessage().contains("999"));
        verify(productRepository, times(1)).findByIdWithCategory(999L);
    }

    @Test
    @DisplayName("getProducts - Lấy danh sách thành công với sorting theo giá giảm dần")
    void getProducts_SortByPriceDesc() {
        Page<Product> page = new PageImpl<>(List.of(mockProduct));
        when(productRepository.searchProducts(any(), any(), any(Pageable.class))).thenReturn(page);

        Page<ProductResponse> result = productService.getProducts("áo", 1L, "price", "desc", 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Áo Thun Funny", result.getContent().get(0).getName());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).searchProducts(eq("áo"), eq(1L), pageableCaptor.capture());

        Pageable capturedPageable = pageableCaptor.getValue();
        Sort.Order order = capturedPageable.getSort().getOrderFor("price");
        assertNotNull(order);
        assertTrue(order.isDescending());
    }

    @Test
    @DisplayName("getProducts - Sắp xếp theo tồn kho (stock/stockQuantity)")
    void getProducts_SortByStock() {
        Page<Product> page = new PageImpl<>(List.of(mockProduct));
        when(productRepository.searchProducts(any(), any(), any(Pageable.class))).thenReturn(page);

        productService.getProducts(null, null, "stock", "asc", 0, 10);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).searchProducts(isNull(), isNull(), pageableCaptor.capture());

        Pageable capturedPageable = pageableCaptor.getValue();
        Sort.Order order = capturedPageable.getSort().getOrderFor("stockQuantity");
        assertNotNull(order);
        assertTrue(order.isAscending());
    }

    @Test
    @DisplayName("getProducts - Ném ngoại lệ khi sortDir không hợp lệ")
    void getProducts_InvalidSortDir() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> productService.getProducts(null, null, "price", "invalid", 0, 10)
        );
        assertEquals("sortDir chỉ chấp nhận asc hoặc desc", exception.getMessage());
    }

    @Test
    @DisplayName("getProducts - Ném ngoại lệ khi page < 0")
    void getProducts_InvalidPage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> productService.getProducts(null, null, "id", "asc", -1, 10)
        );
        assertEquals("page phải >= 0", exception.getMessage());
    }

    @Test
    @DisplayName("getProducts - Ném ngoại lệ khi size không trong khoảng 1-100")
    void getProducts_InvalidSize() {
        assertThrows(
                IllegalArgumentException.class,
                () -> productService.getProducts(null, null, "id", "asc", 0, 0)
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> productService.getProducts(null, null, "id", "asc", 0, 101)
        );
    }
}

