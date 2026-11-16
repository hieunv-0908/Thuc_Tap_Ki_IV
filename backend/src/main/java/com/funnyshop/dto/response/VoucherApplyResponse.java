package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VoucherApplyResponse {

    private boolean valid;
    private String voucherCode;
    private String voucherName;
    private BigDecimal discountAmount;
    private BigDecimal subtotalAmount;
    private BigDecimal finalAmount;
    private String message;
}

