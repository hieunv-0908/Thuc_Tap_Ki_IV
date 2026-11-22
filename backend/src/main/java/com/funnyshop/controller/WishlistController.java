package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.WishlistResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.WishlistService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/wishlists", "/api/wishlists"})
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long resolveUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }

        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String jwt = bearerToken.substring(7);
            return jwtTokenProvider.getUserIdFromToken(jwt);
        }

        return null;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WishlistResponse>>> getMyWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xem danh sách yêu thích!", HttpStatus.UNAUTHORIZED);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<WishlistResponse> result = wishlistService.getMyWishlist(userId, pageable);

        return ResponseEntity.ok(
                ApiResponse.<Page<WishlistResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách yêu thích thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<List<Long>>> getMyWishlistProductIds(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.ok(
                    ApiResponse.<List<Long>>builder()
                            .code(HttpStatus.OK.value())
                            .data(List.of())
                            .build()
            );
        }

        List<Long> ids = wishlistService.getMyWishlistProductIds(userId);
        return ResponseEntity.ok(
                ApiResponse.<List<Long>>builder()
                        .code(HttpStatus.OK.value())
                        .data(ids)
                        .build()
        );
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleWishlist(
            @PathVariable Long productId,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thêm sản phẩm yêu thích!", HttpStatus.UNAUTHORIZED);
        }

        boolean isLiked = wishlistService.toggleWishlist(userId, productId);
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(HttpStatus.OK.value())
                        .message(isLiked ? "Đã thêm vào danh sách yêu thích!" : "Đã bỏ khỏi danh sách yêu thích!")
                        .data(Map.of("productId", productId, "isLiked", isLiked))
                        .build()
        );
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long productId,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này!", HttpStatus.UNAUTHORIZED);
        }

        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã xóa sản phẩm khỏi danh sách yêu thích!")
                        .build()
        );
    }
}

