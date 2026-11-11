package com.funnyshop.service.impl;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.ProductVariant;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.InsufficientStockException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.ProductVariantRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
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

        // Gộp số lượng theo variantId
        Map<Long, Integer> variantQuantities = new HashMap<>();
        for (OrderCheckoutItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new AppException("Số lượng đặt mua không hợp lệ!", HttpStatus.BAD_REQUEST);
            }

            Long targetVariantId = itemReq.getVariantId();
            if (targetVariantId == null && itemReq.getProductId() != null) {
                // Tương thích ngược: Lấy biến thể đầu tiên của sản phẩm nếu client cũ chỉ truyền productId
                List<ProductVariant> variants = productVariantRepository.findByProductIdAndIsDeletedFalse(itemReq.getProductId());
                if (variants.isEmpty()) {
                    throw new ResourceNotFoundException("Không tìm thấy biến thể khả dụng cho sản phẩm ID: " + itemReq.getProductId());
                }
                targetVariantId = variants.get(0).getId();
            }

            if (targetVariantId == null) {
                throw new AppException("Thông tin sản phẩm hoặc biến thể không được để trống!", HttpStatus.BAD_REQUEST);
            }

            variantQuantities.merge(targetVariantId, itemReq.getQuantity(), Integer::sum);
        }

        // Sắp xếp variantId tăng dần (ASC) để triệt tiêu nguy cơ Deadlock giữa các transaction đồng thời
        List<Map.Entry<Long, Integer>> sortedEntries = variantQuantities.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .toList();

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

        for (Map.Entry<Long, Integer> entry : sortedEntries) {
            Long variantId = entry.getKey();
            Integer quantity = entry.getValue();

            ProductVariant variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm với ID: " + variantId));

            if (Boolean.TRUE.equals(variant.getIsDeleted()) ||
                    (variant.getProduct() != null && Boolean.TRUE.equals(variant.getProduct().getIsDeleted()))) {
                String name = variant.getProduct() != null ? variant.getProduct().getName() : "Sản phẩm";
                throw new AppException("Sản phẩm '" + name + "' đã ngừng kinh doanh!", HttpStatus.BAD_REQUEST);
            }

            // Trừ tồn kho nguyên tử trực tiếp ở tầng CSDL
            int updatedRows = productVariantRepository.decrementStockAtomic(variantId, quantity);
            if (updatedRows == 0) {
                String productName = variant.getProduct() != null ? variant.getProduct().getName() : "Sản phẩm";
                String displayName = productName + " (" + variant.getColor() + " - " + variant.getSize() + ")";
                throw new InsufficientStockException(displayName, quantity, variant.getStockQuantity());
            }

            BigDecimal priceAtOrder = variant.getPrice();
            BigDecimal itemTotal = priceAtOrder.multiply(BigDecimal.valueOf(quantity));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(variant.getProduct())
                    .productVariant(variant)
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

        // Nếu chuyển sang CANCELLED thì tiến hành hoàn kho nguyên tử
        if (newStatus == OrderStatus.CANCELLED) {
            // Sắp xếp variantId tăng dần để triệt tiêu deadlock
            List<OrderItem> sortedItems = order.getOrderItems()
                    .stream()
                    .filter(item -> item.getProductVariant() != null)
                    .sorted(Comparator.comparing(item -> item.getProductVariant().getId()))
                    .toList();

            for (OrderItem item : sortedItems) {
                Long variantId = item.getProductVariant().getId();
                Integer quantity = item.getQuantity();

                if (quantity != null && quantity > 0) {
                    productVariantRepository.incrementStockAtomic(variantId, quantity);
                }
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
    public OrderResponse getOrderById(Long orderId, Long userId, boolean isAdmin) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!isAdmin && !order.getUser().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền xem thông tin đơn hàng này!", HttpStatus.FORBIDDEN);
        }

        return OrderResponse.fromEntity(order);
    }
}
