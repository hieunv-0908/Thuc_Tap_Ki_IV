package com.funnyshop.service.impl;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse checkout(Long userId, OrderCheckoutRequest request) {
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thực hiện đặt hàng!", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với ID: " + userId));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException("Danh sách sản phẩm đặt hàng không được để trống!", HttpStatus.BAD_REQUEST);
        }

        // Gộp số lượng nếu request có nhiều item cùng productId
        Map<Long, Integer> productQuantities = new LinkedHashMap<>();
        for (OrderCheckoutItemRequest itemReq : request.getItems()) {
            if (itemReq.getProductId() == null || itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new AppException("Thông tin sản phẩm hoặc số lượng đặt mua không hợp lệ!", HttpStatus.BAD_REQUEST);
            }
            productQuantities.merge(itemReq.getProductId(), itemReq.getQuantity(), Integer::sum);
        }

        Order order = Order.builder()
                .user(user)
                .customerName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .shippingAddress(request.getAddress().trim())
                .paymentMethod((request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                        ? request.getPaymentMethod().trim()
                        : "COD")
                .status(OrderStatus.PENDING)
                .orderItems(new ArrayList<>())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Long productId = entry.getKey();
            Integer quantity = entry.getValue();

            // Khóa bi quan bản ghi sản phẩm để chống race condition / overselling
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy sản phẩm với ID: " + productId + " hoặc sản phẩm đã ngừng kinh doanh!"
                    ));

            if (Boolean.TRUE.equals(product.getIsDeleted())) {
                throw new AppException(
                        "Sản phẩm '" + product.getName() + "' đã ngừng kinh doanh!",
                        HttpStatus.BAD_REQUEST
                );
            }

            int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (availableStock < quantity) {
                throw new AppException(
                        "Sản phẩm '" + product.getName() + "' không đủ số lượng tồn kho (hiện còn: "
                                + availableStock + ", yêu cầu: " + quantity + ")!",
                        HttpStatus.BAD_REQUEST
                );
            }

            // Trừ tồn kho tự động
            product.setStockQuantity(availableStock - quantity);
            productRepository.save(product);

            // Chốt giá mua bất biến tại thời điểm đặt hàng
            BigDecimal priceAtOrder = product.getPrice();
            BigDecimal itemTotal = priceAtOrder.multiply(BigDecimal.valueOf(quantity));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(quantity)
                    .priceAtOrder(priceAtOrder)
                    .build();

            order.getOrderItems().add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        return OrderResponse.fromEntity(savedOrder);
    }

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
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {

        // Khóa đơn hàng để tránh nhiều request cùng xử lý một đơn
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng với ID: " + orderId
                ));

        OrderStatus currentStatus = order.getStatus();

        // Kiểm tra quy tắc chuyển trạng thái
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new AppException(
                    "Không thể chuyển trạng thái đơn hàng từ "
                            + currentStatus + " sang " + newStatus,
                    HttpStatus.BAD_REQUEST
            );
        }

        // Nếu chuyển sang CANCELLED thì tiến hành hoàn kho
        if (newStatus == OrderStatus.CANCELLED) {

            // Sắp xếp ID sản phẩm để giảm nguy cơ deadlock
            List<OrderItem> sortedItems = order.getOrderItems()
                    .stream()
                    .sorted(Comparator.comparing(
                            item -> item.getProduct().getId()
                    ))
                    .toList();

            for (OrderItem item : sortedItems) {

                Long productId = item.getProduct().getId();
                Integer quantity = item.getQuantity();

                if (quantity == null || quantity <= 0) {
                    throw new AppException(
                            "Số lượng sản phẩm trong đơn hàng không hợp lệ!",
                            HttpStatus.BAD_REQUEST
                    );
                }

                // Khóa sản phẩm trước khi cập nhật tồn kho
                Product product = productRepository
                        .findByIdForUpdateIncludingDeleted(productId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm với ID: " + productId
                        ));

                int currentStock = product.getStockQuantity() != null
                        ? product.getStockQuantity()
                        : 0;

                int restoredStock;

                try {
                    restoredStock = Math.addExact(currentStock, quantity);
                } catch (ArithmeticException ex) {
                    throw new AppException(
                            "Số lượng tồn kho vượt quá giới hạn cho phép!",
                            HttpStatus.BAD_REQUEST
                    );
                }

                product.setStockQuantity(restoredStock);
                productRepository.save(product);
            }
        }

        // Cập nhật trạng thái đơn hàng sau khi hoàn kho
        order.setStatus(newStatus);

        Order savedOrder = orderRepository.save(order);

        return OrderResponse.fromEntity(savedOrder);
    }

    @Override
    public List<OrderResponse> getMyOrdersList(Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);

        return orders.stream()
                .sorted(
                        Comparator.comparing(
                                Order::getCreatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())
                        )
                )
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Override
    public Page<OrderResponse> getMyOrders(Long userId, int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page phải >= 0");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("size phải nằm trong khoảng 1 đến 100");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return orderRepository.findByUserId(userId, pageable)
                .map(OrderResponse::fromEntity);
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
