package com.funnyshop.service.impl;

import com.funnyshop.dto.request.ProductCreateRequest;
import com.funnyshop.dto.request.ProductUpdateRequest;
import com.funnyshop.dto.response.ProductResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.entity.Product;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

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

        // Map tên trường hợp lệ và an toàn
        String property = "id";
        if (sortBy != null && !sortBy.isBlank()) {
            property = switch (sortBy.trim()) {
                case "price" -> "price";
                case "stock", "stockQuantity" -> "stockQuantity";
                case "name" -> "name";
                case "createdAt" -> "createdAt";
                case "id" -> "id";
                default -> "id";
            };
        }

        // Xác định chiều sắp xếp (asc / desc)
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
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .category(category)
                .imageUrl(request.getImageUrl())
                .isDeleted(false)
                .build();

        Product savedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findByIdAndIsDeletedFalse(id)
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
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());

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
}
