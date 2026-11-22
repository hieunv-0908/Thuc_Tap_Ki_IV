package com.funnyshop.controller;

import com.funnyshop.dto.request.AddressRequest;
import com.funnyshop.dto.response.AddressResponse;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.AddressService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/addresses", "/api/addresses"})
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
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
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyAddresses(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xem danh sách địa chỉ!", HttpStatus.UNAUTHORIZED);
        }

        List<AddressResponse> result = addressService.getMyAddresses(userId);
        return ResponseEntity.ok(
                ApiResponse.<List<AddressResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách địa chỉ nhận hàng thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressDetail(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xem chi tiết địa chỉ!", HttpStatus.UNAUTHORIZED);
        }

        AddressResponse result = addressService.getAddressDetail(userId, id);
        return ResponseEntity.ok(
                ApiResponse.<AddressResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin địa chỉ thành công!")
                        .data(result)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @Valid @RequestBody AddressRequest requestBody,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thêm địa chỉ nhận hàng!", HttpStatus.UNAUTHORIZED);
        }

        AddressResponse result = addressService.createAddress(userId, requestBody);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<AddressResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Thêm địa chỉ nhận hàng thành công!")
                        .data(result)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest requestBody,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để cập nhật địa chỉ!", HttpStatus.UNAUTHORIZED);
        }

        AddressResponse result = addressService.updateAddress(userId, id, requestBody);
        return ResponseEntity.ok(
                ApiResponse.<AddressResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật địa chỉ nhận hàng thành công!")
                        .data(result)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xóa địa chỉ!", HttpStatus.UNAUTHORIZED);
        }

        addressService.deleteAddress(userId, id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã xóa địa chỉ thành công!")
                        .build()
        );
    }

    @PatchMapping("/{id}/set-default")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này!", HttpStatus.UNAUTHORIZED);
        }

        AddressResponse result = addressService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(
                ApiResponse.<AddressResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã đặt làm địa chỉ nhận hàng mặc định!")
                        .data(result)
                        .build()
        );
    }
}

