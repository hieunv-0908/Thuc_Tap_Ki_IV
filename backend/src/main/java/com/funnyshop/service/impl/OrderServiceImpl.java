package com.funnyshop.service.impl;

import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    @Override
    public Page<OrderResponse> getAllOrders(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page phải >= 0");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("size phải nằm trong khoảng 1 đến 100");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepository.findAllOrders(pageable).map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseGet(() -> orderRepository.findById(orderId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy đơn hàng với ID: " + orderId
                        ))
                );

        OrderStatus currentStatus = order.getStatus();
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new AppException(
                    "Không thể chuyển trạng thái đơn hàng từ " + currentStatus + " sang " + newStatus,
                    HttpStatus.BAD_REQUEST
            );
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        return OrderResponse.fromEntity(savedOrder);
    }

    @Override
    public Page<OrderResponse> getMyOrders(Long userId, int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page phải >= 0");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("size phải nằm trong khoảng 1 đến 100");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepository.findByUserId(userId, pageable).map(OrderResponse::fromEntity);
    }

    @Override
    public List<OrderResponse> getMyOrdersList(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Override
    public OrderResponse getOrderById(Long orderId, Long currentUserId, boolean isAdmin) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseGet(() -> orderRepository.findById(orderId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy đơn hàng với ID: " + orderId
                        ))
                );

        if (!isAdmin) {
            if (order.getUser() == null || !order.getUser().getId().equals(currentUserId)) {
                throw new AppException(
                        "Bạn không có quyền truy cập đơn hàng này!",
                        HttpStatus.FORBIDDEN,
                        HttpStatus.FORBIDDEN.value()
                );
            }
        }

        return OrderResponse.fromEntity(order);
    }
}

