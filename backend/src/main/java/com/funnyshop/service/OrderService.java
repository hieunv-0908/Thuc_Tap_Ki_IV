package com.funnyshop.service;

import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.dto.response.OrderStatusHistoryResponse;
import com.funnyshop.enums.OrderStatus;
import org.springframework.data.domain.Page;

import java.util.List;

public interface OrderService {
    OrderResponse checkout(Long userId, OrderCheckoutRequest request);
    OrderResponse checkout(Long userId, OrderCheckoutRequest request, String idempotencyKey);
    Page<OrderResponse> getAllOrders(int page, int size);
    OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus);
    OrderResponse cancelOrder(Long orderId);
    OrderResponse cancelOrder(Long orderId, Long currentUserId, boolean isAdmin);
    OrderResponse cancelOrder(Long orderId, Long currentUserId, boolean isAdmin, String reason);
    Page<OrderResponse> getMyOrders(Long userId, int page, int size);
    List<OrderResponse> getMyOrdersList(Long userId);
    OrderResponse getOrderById(Long orderId, Long currentUserId, boolean isAdmin);
    List<OrderStatusHistoryResponse> getOrderTimeline(Long orderId, Long currentUserId, boolean isAdmin);
}
