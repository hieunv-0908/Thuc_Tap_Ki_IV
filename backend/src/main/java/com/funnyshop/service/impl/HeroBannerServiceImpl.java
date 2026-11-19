package com.funnyshop.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.funnyshop.dto.response.HeroBannerResponse;
import com.funnyshop.entity.HeroBanner;
import com.funnyshop.repository.HeroBannerRepository;
import com.funnyshop.service.HeroBannerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class HeroBannerServiceImpl implements HeroBannerService {

    private final HeroBannerRepository heroBannerRepository;
    private final Cloudinary cloudinary;

    @Override
    public List<HeroBannerResponse> getActiveBanners() {
        return heroBannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream().map(HeroBannerResponse::fromEntity).toList();
    }

    @Override
    public List<HeroBannerResponse> getAllBanners() {
        return heroBannerRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()
                .stream().map(HeroBannerResponse::fromEntity).toList();
    }

    @Override
    @Transactional
    public HeroBannerResponse createBanner(String title, String subtitle, String description,
                                            String ctaText, String ctaLink, Boolean isActive,
                                            Integer displayOrder, MultipartFile image) {
        String imageUrl = "";
        String publicId = null;

        if (image != null && !image.isEmpty()) {
            Map<?, ?> uploadResult = uploadImage(image);
            imageUrl = (String) uploadResult.get("secure_url");
            publicId = (String) uploadResult.get("public_id");
        }

        HeroBanner banner = HeroBanner.builder()
                .title(title)
                .subtitle(subtitle)
                .description(description)
                .imageUrl(imageUrl)
                .cloudinaryPublicId(publicId)
                .ctaText(ctaText != null ? ctaText : "Khám phá ngay")
                .ctaLink(ctaLink != null ? ctaLink : "#products-catalog")
                .isActive(isActive != null ? isActive : true)
                .displayOrder(displayOrder != null ? displayOrder : 0)
                .build();

        return HeroBannerResponse.fromEntity(heroBannerRepository.save(banner));
    }

    @Override
    @Transactional
    public HeroBannerResponse updateBanner(Long id, String title, String subtitle, String description,
                                            String ctaText, String ctaLink, Boolean isActive,
                                            Integer displayOrder, MultipartFile image) {
        HeroBanner banner = heroBannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner không tồn tại với id: " + id));

        if (image != null && !image.isEmpty()) {
            // Delete old image if exists
            if (banner.getCloudinaryPublicId() != null) {
                deleteImage(banner.getCloudinaryPublicId());
            }
            Map<?, ?> uploadResult = uploadImage(image);
            banner.setImageUrl((String) uploadResult.get("secure_url"));
            banner.setCloudinaryPublicId((String) uploadResult.get("public_id"));
        }

        if (title != null) banner.setTitle(title);
        if (subtitle != null) banner.setSubtitle(subtitle);
        if (description != null) banner.setDescription(description);
        if (ctaText != null) banner.setCtaText(ctaText);
        if (ctaLink != null) banner.setCtaLink(ctaLink);
        if (isActive != null) banner.setIsActive(isActive);
        if (displayOrder != null) banner.setDisplayOrder(displayOrder);

        return HeroBannerResponse.fromEntity(heroBannerRepository.save(banner));
    }

    @Override
    @Transactional
    public HeroBannerResponse toggleStatus(Long id) {
        HeroBanner banner = heroBannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner không tồn tại với id: " + id));
        banner.setIsActive(!banner.getIsActive());
        return HeroBannerResponse.fromEntity(heroBannerRepository.save(banner));
    }

    @Override
    @Transactional
    public void deleteBanner(Long id) {
        HeroBanner banner = heroBannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner không tồn tại với id: " + id));
        if (banner.getCloudinaryPublicId() != null) {
            deleteImage(banner.getCloudinaryPublicId());
        }
        heroBannerRepository.delete(banner);
    }

    private Map<?, ?> uploadImage(MultipartFile file) {
        try {
            return cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "funnyshop/banners",
                            "resource_type", "image",
                            "quality", "auto:good",
                            "fetch_format", "auto"
                    ));
        } catch (IOException e) {
            log.error("Lỗi upload ảnh lên Cloudinary: {}", e.getMessage());
            throw new RuntimeException("Không thể upload ảnh: " + e.getMessage());
        }
    }

    private void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("Không thể xóa ảnh Cloudinary publicId={}: {}", publicId, e.getMessage());
        }
    }
}
