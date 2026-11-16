package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean isDeleted;
    private Long productCount;

    public static CategoryResponse fromEntity(Category category) {
        return fromEntity(category, 0L);
    }

    public static CategoryResponse fromEntity(Category category, Long productCount) {
        if (category == null) {
            return null;
        }
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .isDeleted(category.getIsDeleted())
                .productCount(productCount != null ? productCount : 0L)
                .build();
    }
}

