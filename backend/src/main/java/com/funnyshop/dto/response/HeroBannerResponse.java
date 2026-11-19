package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.HeroBanner;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HeroBannerResponse {
    private Long id;
    private String title;
    private String subtitle;
    private String description;
    private String imageUrl;
    private String cloudinaryPublicId;
    private String ctaText;
    private String ctaLink;
    private Boolean isActive;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static HeroBannerResponse fromEntity(HeroBanner b) {
        return HeroBannerResponse.builder()
                .id(b.getId())
                .title(b.getTitle())
                .subtitle(b.getSubtitle())
                .description(b.getDescription())
                .imageUrl(b.getImageUrl())
                .cloudinaryPublicId(b.getCloudinaryPublicId())
                .ctaText(b.getCtaText())
                .ctaLink(b.getCtaLink())
                .isActive(b.getIsActive())
                .displayOrder(b.getDisplayOrder())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
