package com.funnyshop.service;

import com.funnyshop.dto.response.PayOSPaymentResponse;
import com.funnyshop.entity.Order;

import java.util.Map;

public interface PayOSService {

    PayOSPaymentResponse createPaymentLink(Order order, String returnUrlOverride, String cancelUrlOverride);

    PayOSPaymentResponse createOrGetPaymentLinkForOrder(Long orderId, Long userId);

    boolean verifyWebhookData(Map<String, Object> webhookBody);

    Order processPaymentWebhook(Map<String, Object> webhookBody);

    String checkPaymentStatus(Long orderId, Long userId);
}

