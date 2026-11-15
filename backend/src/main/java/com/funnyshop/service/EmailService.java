package com.funnyshop.service;

import com.funnyshop.event.OrderCancelledEvent;
import com.funnyshop.event.OrderCreatedEvent;

public interface EmailService {
    void sendOrderConfirmationEmail(OrderCreatedEvent event);
    void sendOrderCancelledEmail(OrderCancelledEvent event);
}

