package com.funnyshop.service;

import com.funnyshop.entity.Product;
import org.springframework.data.domain.Page;

public interface ProductService {

    Page<Product> getProducts(
            String keyword,
            Long categoryId,
            String sort,
            int page,
            int size
    );
}
