package com.funnyshop.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnReviewRequest {

    @NotBlank(message = "Hành động (APPROVE hoặc REJECT) không được để trống!")
    private String action; // APPROVE hoặc REJECT

    private String adminNote; // Bắt buộc khi REJECT
}

