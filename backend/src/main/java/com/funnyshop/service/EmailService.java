package com.funnyshop.service;

import com.funnyshop.event.OrderCancelledEvent;
import com.funnyshop.event.OrderCreatedEvent;
import com.funnyshop.entity.ReturnRequest;

public interface EmailService {
    void sendOrderConfirmationEmail(OrderCreatedEvent event);
    void sendOrderCancelledEmail(OrderCancelledEvent event);
    void sendReturnRejectedEmail(ReturnRequest returnRequest);
    void sendReturnApprovedEmail(ReturnRequest returnRequest);
}

