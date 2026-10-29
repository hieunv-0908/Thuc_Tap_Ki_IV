package com.funnyshop.service;

import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.enums.OrderStatus;
import org.springframework.data.domain.Page;

import java.util.List;

public interface OrderService {
    Page<OrderResponse> getAllOrders(int page, int size);
    OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus);
    Page<OrderResponse> getMyOrders(Long userId, int page, int size);
    List<OrderResponse> getMyOrdersList(Long userId);
    OrderResponse getOrderById(Long orderId, Long currentUserId, boolean isAdmin);
}

