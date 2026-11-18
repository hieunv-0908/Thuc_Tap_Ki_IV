package com.funnyshop.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnCreateRequest {

    @NotBlank(message = "Lý do trả hàng không được để trống!")
    private String reason;

    private String description;

    private List<String> evidenceImages;

    private String bankName;

    private String bankAccountNumber;

    private String bankAccountName;
}

