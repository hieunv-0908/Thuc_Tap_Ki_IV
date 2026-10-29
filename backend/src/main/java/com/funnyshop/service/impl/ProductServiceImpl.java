package com.funnyshop.service.impl;

import com.funnyshop.entity.Product;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.funnyshop.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public Page<Product> getProducts(
            String keyword,
            Long categoryId,
            String sort,
            int page,
            int size
    ) {
        if (page < 0) {
            throw new IllegalArgumentException("page phải >= 0");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "size phải nằm trong khoảng 1 đến 100"
            );
        }

        Sort sorting;

        if (sort == null || sort.isBlank()) {
            sorting = Sort.by(Sort.Direction.ASC, "id");
        } else {
            sorting = switch (sort.trim().toLowerCase()) {
                case "asc" -> Sort.by(Sort.Direction.ASC, "price");
                case "desc" -> Sort.by(Sort.Direction.DESC, "price");
                default -> throw new IllegalArgumentException(
                        "sort chỉ chấp nhận asc hoặc desc"
                );
            };
        }

        String normalizedKeyword =
                keyword == null || keyword.isBlank()
                        ? null
                        : keyword.trim();

        Pageable pageable = PageRequest.of(page, size, sorting);

        return productRepository.searchProducts(
                normalizedKeyword,
                categoryId,
                pageable
        );
    }
    @Override
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm với ID: " + id
                        )
                );
    }
}
