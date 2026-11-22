package com.funnyshop.service;

import com.funnyshop.dto.response.WishlistResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WishlistService {

    Page<WishlistResponse> getMyWishlist(Long userId, Pageable pageable);

    List<Long> getMyWishlistProductIds(Long userId);

    boolean toggleWishlist(Long userId, Long productId);

    void removeFromWishlist(Long userId, Long productId);

    boolean isInWishlist(Long userId, Long productId);
}

