package com.funnyshop.event;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
public class OrderCancelledEvent {
    private final Long orderId;
    private final Long userId;
    private final String customerName;
    private final String userEmail;
    private final String phone;
    private final BigDecimal totalAmount;
    private final String cancellationSource; // "USER" | "ADMIN"
    private final LocalDateTime cancelledAt;
}

