package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PayOSPaymentResponse {
    private Long orderCode;
    private Long amount;
    private String description;
    private String checkoutUrl;
    private String qrCode;
    private String status;
    private String paymentLinkId;
    private String accountNumber;
    private String accountName;
    private String bin;
}

