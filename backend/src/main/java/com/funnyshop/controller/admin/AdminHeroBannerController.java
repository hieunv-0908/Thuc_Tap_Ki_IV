package com.funnyshop.controller.admin;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.HeroBannerResponse;
import com.funnyshop.service.HeroBannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin/banners", "/api/admin/banners"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHeroBannerController {

    private final HeroBannerService heroBannerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HeroBannerResponse>>> getAllBanners() {
        return ResponseEntity.ok(ApiResponse.<List<HeroBannerResponse>>builder()
                .code(200).message("Lấy danh sách banner thành công!")
                .data(heroBannerService.getAllBanners()).build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<HeroBannerResponse>> createBanner(
            @RequestParam("title") String title,
            @RequestParam(value = "subtitle", required = false) String subtitle,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "ctaText", required = false) String ctaText,
            @RequestParam(value = "ctaLink", required = false) String ctaLink,
            @RequestParam(value = "isActive", defaultValue = "true") Boolean isActive,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        HeroBannerResponse banner = heroBannerService.createBanner(
                title, subtitle, description, ctaText, ctaLink, isActive, displayOrder, image);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<HeroBannerResponse>builder()
                        .code(201).message("Tạo banner thành công!").data(banner).build());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<HeroBannerResponse>> updateBanner(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "subtitle", required = false) String subtitle,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "ctaText", required = false) String ctaText,
            @RequestParam(value = "ctaLink", required = false) String ctaLink,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "displayOrder", required = false) Integer displayOrder,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        HeroBannerResponse banner = heroBannerService.updateBanner(
                id, title, subtitle, description, ctaText, ctaLink, isActive, displayOrder, image);

        return ResponseEntity.ok(ApiResponse.<HeroBannerResponse>builder()
                .code(200).message("Cập nhật banner thành công!").data(banner).build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<HeroBannerResponse>> toggleStatus(@PathVariable Long id) {
        HeroBannerResponse banner = heroBannerService.toggleStatus(id);
        String msg = Boolean.TRUE.equals(banner.getIsActive()) ? "Banner đã được bật!" : "Banner đã được tắt!";
        return ResponseEntity.ok(ApiResponse.<HeroBannerResponse>builder()
                .code(200).message(msg).data(banner).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable Long id) {
        heroBannerService.deleteBanner(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(200).message("Xóa banner thành công!").build());
    }
}
