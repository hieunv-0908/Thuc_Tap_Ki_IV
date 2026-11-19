package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.HeroBannerResponse;
import com.funnyshop.service.HeroBannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/banners", "/api/banners"})
@RequiredArgsConstructor
public class HeroBannerController {

    private final HeroBannerService heroBannerService;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<HeroBannerResponse>>> getActiveBanners() {
        List<HeroBannerResponse> banners = heroBannerService.getActiveBanners();
        return ResponseEntity.ok(ApiResponse.<List<HeroBannerResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy danh sách banner đang hiển thị thành công!")
                .data(banners)
                .build());
    }
}
