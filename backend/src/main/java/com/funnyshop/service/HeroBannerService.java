package com.funnyshop.service;

import com.funnyshop.dto.response.HeroBannerResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface HeroBannerService {
    List<HeroBannerResponse> getActiveBanners();
    List<HeroBannerResponse> getAllBanners();
    HeroBannerResponse createBanner(String title, String subtitle, String description,
                                    String ctaText, String ctaLink, Boolean isActive,
                                    Integer displayOrder, MultipartFile image);
    HeroBannerResponse updateBanner(Long id, String title, String subtitle, String description,
                                    String ctaText, String ctaLink, Boolean isActive,
                                    Integer displayOrder, MultipartFile image);
    HeroBannerResponse toggleStatus(Long id);
    void deleteBanner(Long id);
}
