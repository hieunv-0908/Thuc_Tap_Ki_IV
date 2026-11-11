package com.funnyshop.service;

import com.funnyshop.dto.request.*;
import com.funnyshop.dto.response.ProductImageResponse;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.dto.response.ProductVariantResponse;
import org.springframework.data.domain.Page;

public interface ProductService {
    ProductResponse getProductById(Long id);
    Page<ProductResponse> getProducts(
            String keyword,
            Long categoryId,
            String sortBy,
            String sortDir,
            int page,
            int size
    );
    Page<ProductResponse> getAllProducts(
            String keyword,
            Long categoryId,
            String sortBy,
            String sortDir,
            int page,
            int size
    );
    ProductResponse createProduct(ProductCreateRequest request);
    ProductResponse updateProduct(Long id, ProductUpdateRequest request);
    void deleteProduct(Long id);
    ProductResponse restoreProduct(Long id);

    // Variant Management
    ProductVariantResponse addVariant(Long productId, ProductVariantCreateRequest request);
    ProductVariantResponse updateVariant(Long variantId, ProductVariantUpdateRequest request);
    void deleteVariant(Long variantId);
    ProductVariantResponse restoreVariant(Long variantId);

    // Image Management
    ProductImageResponse addImage(Long productId, ProductImageCreateRequest request);
    ProductImageResponse setPrimaryImage(Long imageId);
    void deleteImage(Long imageId);
}
