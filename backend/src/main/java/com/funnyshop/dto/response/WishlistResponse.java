package com.funnyshop.dto.response;

import com.funnyshop.entity.Wishlist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {

    private Long id;
    private Long userId;
    private ProductResponse product;
    private LocalDateTime createdAt;

    public static WishlistResponse fromEntity(Wishlist wishlist) {
        if (wishlist == null) return null;
        return WishlistResponse.builder()
                .id(wishlist.getId())
                .userId(wishlist.getUser() != null ? wishlist.getUser().getId() : null)
                .product(wishlist.getProduct() != null ? ProductResponse.fromEntity(wishlist.getProduct()) : null)
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}

