package com.funnyshop.service.impl;

import com.funnyshop.dto.response.WishlistResponse;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.User;
import com.funnyshop.entity.Wishlist;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.repository.WishlistRepository;
import com.funnyshop.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<WishlistResponse> getMyWishlist(Long userId, Pageable pageable) {
        return wishlistRepository.findByUserId(userId, pageable)
                .map(WishlistResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> getMyWishlistProductIds(Long userId) {
        return wishlistRepository.findProductIdsByUserId(userId);
    }

    @Override
    @Transactional
    public boolean toggleWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại với ID: " + productId));

        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            log.info("User {} removed product {} from wishlist", userId, productId);
            return false;
        } else {
            Wishlist item = Wishlist.builder()
                    .user(user)
                    .product(product)
                    .build();
            wishlistRepository.save(item);
            log.info("User {} added product {} to wishlist", userId, productId);
            return true;
        }
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        log.info("User {} removed product {} from wishlist", userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }
}

