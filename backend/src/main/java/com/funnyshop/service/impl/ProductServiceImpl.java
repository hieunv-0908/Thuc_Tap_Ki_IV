package com.funnyshop.service.impl;

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
import com.funnyshop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;

    @Override
    public Page<ProductResponse> getProducts(
            String keyword,
            Long categoryId,
            String sortBy,
            String sortDir,
            int page,
            int size
    ) {
        if (page < 0) {
            throw new IllegalArgumentException("page phải >= 0");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("size phải nằm trong khoảng 1 đến 100");
        }

        String property = "id";
        if (sortBy != null && !sortBy.isBlank()) {
            property = switch (sortBy.trim()) {
                case "name" -> "name";
                case "createdAt" -> "createdAt";
                case "id" -> "id";
                default -> "id";
            };
        }

        Sort.Direction direction = Sort.Direction.ASC;
        if (sortDir != null && !sortDir.isBlank()) {
            if ("desc".equalsIgnoreCase(sortDir.trim())) {
                direction = Sort.Direction.DESC;
            } else if ("asc".equalsIgnoreCase(sortDir.trim())) {
                direction = Sort.Direction.ASC;
            } else {
                throw new IllegalArgumentException("sortDir chỉ chấp nhận asc hoặc desc");
            }
        }

        Sort sorting = Sort.by(direction, property);
        Pageable pageable = PageRequest.of(page, size, sorting);

        String normalizedKeyword = (keyword == null || keyword.isBlank())
                ? null
                : keyword.trim();

        return productRepository.searchProducts(
                normalizedKeyword,
                categoryId,
                pageable
        ).map(ProductResponse::fromEntity);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdWithCategory(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm với ID: " + id
                        )
                );
        return ProductResponse.fromEntity(product);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + request.getCategoryId()
                        )
                );

        Product product = Product.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .category(category)
                .isDeleted(request.getIsDeleted() != null ? request.getIsDeleted() : false)
                .variants(new ArrayList<>())
                .images(new ArrayList<>())
                .build();

        Product savedProduct = productRepository.save(product);

        // Tự động tạo biến thể mặc định nếu có truyền price hoặc stockQuantity (Backward-compatible)
        if (request.getPrice() != null || request.getStockQuantity() != null) {
            ProductVariant defaultVariant = ProductVariant.builder()
                    .product(savedProduct)
                    .sku("SKU-" + savedProduct.getId() + "-DEF")
                    .color("Standard")
                    .size("F")
                    .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                    .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                    .isDeleted(false)
                    .build();
            savedProduct.getVariants().add(productVariantRepository.save(defaultVariant));
        }

        // Tự động gán ảnh đại diện nếu có truyền imageUrl
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            ProductImage defaultImage = ProductImage.builder()
                    .product(savedProduct)
                    .imageUrl(request.getImageUrl().trim())
                    .isPrimary(true)
                    .build();
            savedProduct.getImages().add(productImageRepository.save(defaultImage));
        }

        return ProductResponse.fromEntity(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm với ID: " + id
                        )
                );

        Category category = categoryRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy danh mục với ID: " + request.getCategoryId()
                        )
                );

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setCategory(category);

        if (request.getIsDeleted() != null) {
            product.setIsDeleted(request.getIsDeleted());
        }

        // Cập nhật giá/tồn kho biến thể mặc định nếu có truyền
        if (request.getPrice() != null || request.getStockQuantity() != null) {
            if (product.getVariants() != null && !product.getVariants().isEmpty()) {
                ProductVariant primaryVariant = product.getVariants().get(0);
                if (request.getPrice() != null) {
                    primaryVariant.setPrice(request.getPrice());
                }
                if (request.getStockQuantity() != null) {
                    primaryVariant.setStockQuantity(request.getStockQuantity());
                }
                productVariantRepository.save(primaryVariant);
            } else {
                ProductVariant newVariant = ProductVariant.builder()
                        .product(product)
                        .sku("SKU-" + product.getId() + "-DEF")
                        .color("Standard")
                        .size("F")
                        .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                        .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                        .isDeleted(false)
                        .build();
                product.getVariants().add(productVariantRepository.save(newVariant));
            }
        }

        // Cập nhật ảnh đại diện nếu có truyền
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                ProductImage primaryImg = product.getImages().stream()
                        .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                        .findFirst()
                        .orElse(product.getImages().get(0));
                primaryImg.setImageUrl(request.getImageUrl().trim());
                productImageRepository.save(primaryImg);
            } else {
                ProductImage newImg = ProductImage.builder()
                        .product(product)
                        .imageUrl(request.getImageUrl().trim())
                        .isPrimary(true)
                        .build();
                product.getImages().add(productImageRepository.save(newImg));
            }
        }

        Product updatedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm với ID: " + id
                        )
                );

        product.setIsDeleted(true);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductResponse restoreProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm với ID: " + id
                        )
                );

        product.setIsDeleted(false);
        Product restoredProduct = productRepository.save(product);
        return ProductResponse.fromEntity(restoredProduct);
    }
}
