package com.funnyshop.service.impl;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.dto.response.OrderStatusHistoryResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.OrderStatusHistory;
import com.funnyshop.entity.ProductVariant;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.event.OrderCancelledEvent;
import com.funnyshop.event.OrderCreatedEvent;
import com.funnyshop.event.OrderItemEventDto;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.InsufficientStockException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.OrderStatusHistoryRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.ProductVariantRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.OrderService;
import com.funnyshop.service.PayOSService;
import com.funnyshop.service.VoucherService;
import com.funnyshop.dto.response.PayOSPaymentResponse;
import com.funnyshop.entity.Voucher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final VoucherService voucherService;
    private final PayOSService payOSService;
    private final com.funnyshop.service.FlashSaleService flashSaleService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse checkout(Long userId, OrderCheckoutRequest request) {
        String key = (request != null) ? request.getIdempotencyKey() : null;
        return checkout(userId, request, key);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse checkout(Long userId, OrderCheckoutRequest request, String idempotencyKey) {
        User user;
        if (userId == null) {
            // Hỗ trợ đặt hàng trực tiếp qua Chat hoặc Khách vãng lai
            user = (request.getPhone() != null && !request.getPhone().isBlank())
                    ? userRepository.findByPhone(request.getPhone().trim()).orElse(null)
                    : null;
            if (user == null) {
                user = userRepository.findById(2L)
                        .or(() -> userRepository.findAll().stream().filter(u -> !"ADMIN".equalsIgnoreCase(String.valueOf(u.getRole()))).findFirst())
                        .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));
            }
            if (user == null) {
                throw new AppException("Không tìm thấy thông tin tài khoản hợp lệ để tạo đơn hàng!", HttpStatus.BAD_REQUEST);
            }
        } else {
            user = userRepository.findById(userId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với ID: " + userId));
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException("Danh sách sản phẩm đặt hàng không được để trống!", HttpStatus.BAD_REQUEST);
        }

        // Gộp số lượng theo variantId và kiểm tra tính hợp lệ
        Map<Long, Integer> variantQuantities = new HashMap<>();
        Map<Long, Long> variantToProductMap = new HashMap<>();
        Set<Long> productsWithMissingVariant = new HashSet<>();

        for (OrderCheckoutItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new AppException("Số lượng đặt mua không hợp lệ!", HttpStatus.BAD_REQUEST);
            }

            Long targetVariantId = itemReq.getVariantId();
            if (targetVariantId == null && itemReq.getProductId() != null) {
                // Ngăn chặn gửi nhiều dòng cùng productId mà thiếu variantId (gây gộp nhầm)
                if (productsWithMissingVariant.contains(itemReq.getProductId())) {
                    throw new AppException(
                            "Vui lòng chọn rõ kích cỡ/màu sắc cho sản phẩm ID: " + itemReq.getProductId(),
                            HttpStatus.BAD_REQUEST);
                }
                productsWithMissingVariant.add(itemReq.getProductId());

                // Tương thích ngược: Lấy biến thể đầu tiên của sản phẩm nếu client cũ chỉ
                // truyền productId
                List<ProductVariant> variants = productVariantRepository
                        .findByProductIdAndIsDeletedFalse(itemReq.getProductId());
                if (variants.isEmpty()) {
                    throw new ResourceNotFoundException(
                            "Không tìm thấy biến thể khả dụng cho sản phẩm ID: " + itemReq.getProductId());
                }
                if (variants.size() > 1) {
                    throw new AppException("Sản phẩm có nhiều biến thể, vui lòng chọn kích cỡ/màu sắc cụ thể!",
                            HttpStatus.BAD_REQUEST);
                }
                targetVariantId = variants.get(0).getId();
            }

            if (targetVariantId == null) {
                throw new AppException("Thông tin sản phẩm hoặc biến thể không được để trống!", HttpStatus.BAD_REQUEST);
            }

            if (itemReq.getProductId() != null) {
                variantToProductMap.put(targetVariantId, itemReq.getProductId());
            }

            variantQuantities.merge(targetVariantId, itemReq.getQuantity(), Integer::sum);
        }

        // Sắp xếp variantId tăng dần (ASC) để triệt tiêu nguy cơ Deadlock giữa các
        // transaction đồng thời
        List<Map.Entry<Long, Integer>> sortedEntries = variantQuantities.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .toList();

        String finalIdempotencyKey = (idempotencyKey != null && !idempotencyKey.isBlank())
                ? idempotencyKey.trim()
                : (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()
                        ? request.getIdempotencyKey().trim()
                        : null);

        Order order = Order.builder()
                .user(user)
                .customerName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .shippingAddress(request.getAddress().trim())
                .paymentMethod((request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                        ? request.getPaymentMethod().trim()
                        : "COD")
                .status(OrderStatus.PENDING)
                .idempotencyKey(finalIdempotencyKey)
                .orderItems(new ArrayList<>())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : sortedEntries) {
            Long variantId = entry.getKey();
            Integer quantity = entry.getValue();

            ProductVariant variant = productVariantRepository.findByIdWithImages(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy biến thể sản phẩm với ID: " + variantId));

            if (Boolean.TRUE.equals(variant.getIsDeleted()) ||
                    (variant.getProduct() != null && Boolean.TRUE.equals(variant.getProduct().getIsDeleted())) ||
                    (variant.getProduct() != null && variant.getProduct().getCategory() != null
                            && Boolean.TRUE.equals(variant.getProduct().getCategory().getIsDeleted()))) {
                String name = variant.getProduct() != null ? variant.getProduct().getName() : "Sản phẩm";
                throw new AppException("Sản phẩm '" + name + "' đã ngừng kinh doanh hoặc danh mục không khả dụng!", HttpStatus.BAD_REQUEST);
            }

            Long expectedProductId = variantToProductMap.get(variantId);
            if (expectedProductId != null && variant.getProduct() != null
                    && !variant.getProduct().getId().equals(expectedProductId)) {
                throw new AppException("Biến thể ID " + variantId + " không thuộc về sản phẩm ID " + expectedProductId,
                        HttpStatus.BAD_REQUEST);
            }

            // Trừ tồn kho nguyên tử trực tiếp ở tầng CSDL
            int updatedRows = productVariantRepository.decrementStockAtomic(variantId, quantity);
            if (updatedRows == 0) {
                String productName = variant.getProduct() != null ? variant.getProduct().getName() : "Sản phẩm";
                String displayName = productName + " (" + variant.getColor() + " - " + variant.getSize() + ")";
                throw new InsufficientStockException(displayName, quantity, variant.getStockQuantity());
            }

            // Kiểm tra giảm giá Flash Sale nếu sản phẩm thuộc chiến dịch đang chạy
            Long prodId = variant.getProduct() != null ? variant.getProduct().getId() : null;
            Long catId = (variant.getProduct() != null && variant.getProduct().getCategory() != null)
                    ? variant.getProduct().getCategory().getId()
                    : null;
            int flashDiscount = 0;
            if (flashSaleService != null) {
                flashDiscount = flashSaleService.getActiveDiscountPercentForProduct(prodId, catId);
            }

            BigDecimal priceAtOrder = variant.getPrice();
            if (flashDiscount > 0) {
                priceAtOrder = priceAtOrder.multiply(BigDecimal.valueOf(100 - flashDiscount))
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            }

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

        // Tích hợp xử lý Voucher an toàn (Pessimistic Lock & Kiểm tra ràng buộc)
        BigDecimal subtotalAmount = totalAmount;
        BigDecimal discountAmount = BigDecimal.ZERO;
        Voucher appliedVoucher = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            appliedVoucher = voucherService.validateAndGetVoucherForCheckout(
                    request.getVoucherCode(), subtotalAmount, user.getId());
            if (appliedVoucher != null) {
                discountAmount = voucherService.calculateDiscount(appliedVoucher, subtotalAmount);
                order.setVoucher(appliedVoucher);
                order.setVoucherCode(appliedVoucher.getCode());
            }
        }

        // Tích hợp xử lý Điểm thưởng (Loyalty Points)
        BigDecimal pointsDiscount = BigDecimal.ZERO;
        int pointsUsed = (request.getPointsUsed() != null && request.getPointsUsed() > 0) ? request.getPointsUsed() : 0;
        if (pointsUsed > 0) {
            int userPoints = user.getRewardPoints() != null ? user.getRewardPoints() : 0;
            if (pointsUsed > userPoints) {
                throw new AppException("Bạn chỉ có " + userPoints + " điểm thưởng, không đủ " + pointsUsed + " điểm để sử dụng!", HttpStatus.BAD_REQUEST);
            }

            pointsDiscount = BigDecimal.valueOf(pointsUsed * 1000L);
            BigDecimal maxAllowedDiscount = subtotalAmount.multiply(BigDecimal.valueOf(0.5));
            if (pointsDiscount.compareTo(maxAllowedDiscount) > 0) {
                pointsDiscount = maxAllowedDiscount;
                pointsUsed = pointsDiscount.divide(BigDecimal.valueOf(1000), 0, RoundingMode.FLOOR).intValue();
                pointsDiscount = BigDecimal.valueOf(pointsUsed * 1000L);
            }

            user.setRewardPoints(userPoints - pointsUsed);
            userRepository.save(user);

            order.setPointsUsed(pointsUsed);
            order.setPointsDiscount(pointsDiscount);
        }

        BigDecimal finalTotal = subtotalAmount.subtract(discountAmount).subtract(pointsDiscount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        order.setSubtotalAmount(subtotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(finalTotal);

        Order savedOrder = orderRepository.save(order);

        if (appliedVoucher != null) {
            voucherService.recordVoucherUsage(appliedVoucher, user, savedOrder, discountAmount);
        }

        // Ghi nhận lịch sử trạng thái ban đầu của đơn hàng (Audit Trail)
        OrderStatusHistory initialHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .oldStatus(null)
                .newStatus(OrderStatus.PENDING)
                .changedBy(user.getUsername() != null ? user.getUsername() : user.getEmail())
                .note("Đơn hàng được tạo thành công")
                .build();
        orderStatusHistoryRepository.save(initialHistory);

        // Đóng gói Event DTO phẳng (Zero Lazy-Loading Dependency) để gửi email xác nhận ở thread nền
        List<OrderItemEventDto> eventItems = savedOrder.getOrderItems().stream()
                .map(item -> OrderItemEventDto.builder()
                        .variantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName()
                                : (item.getProductVariant() != null && item.getProductVariant().getProduct() != null
                                        ? item.getProductVariant().getProduct().getName()
                                        : "Sản phẩm"))
                        .color(item.getProductVariant() != null ? item.getProductVariant().getColor() : "")
                        .size(item.getProductVariant() != null ? item.getProductVariant().getSize() : "")
                        .quantity(item.getQuantity())
                        .price(item.getPriceAtOrder())
                        .build())
                .toList();

        String userEmail = user.getEmail();
        OrderCreatedEvent createdEvent = OrderCreatedEvent.builder()
                .orderId(savedOrder.getId())
                .userId(user.getId())
                .customerName(savedOrder.getCustomerName())
                .userEmail(userEmail)
                .phone(savedOrder.getPhone())
                .shippingAddress(savedOrder.getShippingAddress())
                .totalAmount(savedOrder.getTotalAmount())
                .paymentMethod(savedOrder.getPaymentMethod())
                .createdAt(savedOrder.getCreatedAt() != null ? savedOrder.getCreatedAt() : LocalDateTime.now())
                .items(eventItems)
                .build();

        eventPublisher.publishEvent(createdEvent);

        OrderResponse orderResponse = OrderResponse.fromEntity(savedOrder);

        // Nếu phương thức thanh toán là PayOS, sinh link thanh toán trực tuyến
        if ("PAYOS".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
            try {
                PayOSPaymentResponse payResponse = payOSService.createPaymentLink(savedOrder, null, null);
                if (payResponse != null) {
                    orderResponse.setPaymentUrl(payResponse.getCheckoutUrl());
                    orderResponse.setQrCode(payResponse.getQrCode());
                    orderResponse.setPayosOrderCode(payResponse.getOrderCode());
                    orderResponse.setPaymentStatus(payResponse.getStatus());
                    orderResponse.setAccountNumber(payResponse.getAccountNumber());
                    orderResponse.setAccountName(payResponse.getAccountName());
                    orderResponse.setBin(payResponse.getBin());
                }
            } catch (Exception e) {
                log.error("[Checkout] Không tạo được link PayOS: {}", e.getMessage(), e);
            }
        }

        return orderResponse;
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

        // Phase 1: Lấy phân trang và danh sách IDs theo đúng thứ tự createdAt DESC
        Page<Order> orderPage = orderRepository.findAllOrders(pageable);

        List<Long> ids = orderPage.getContent().stream()
                .map(Order::getId)
                .toList();

        if (ids.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, orderPage.getTotalElements());
        }

        // Phase 2: Nạp đầy đủ graph (orderItems -> productVariant -> product) trong 1
        // query
        List<Order> fullOrders = orderRepository.findAllWithDetailsByIds(ids);

        // Bảo toàn tuyệt đối thứ tự sắp xếp (Sort Order Preservation) của Phase 1
        Map<Long, Order> orderMap = fullOrders.stream()
                .collect(Collectors.toMap(Order::getId, Function.identity(), (existing, replacing) -> existing));

        List<OrderResponse> responses = ids.stream()
                .map(orderMap::get)
                .filter(Objects::nonNull)
                .map(OrderResponse::fromEntity)
                .peek(this::enrichCancelReason)
                .toList();

        return new PageImpl<>(responses, pageable, orderPage.getTotalElements());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {

        // Khóa đơn hàng để tránh nhiều request cùng xử lý một đơn
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng với ID: " + orderId));

        OrderStatus currentStatus = order.getStatus();

        // Kiểm tra quy tắc chuyển trạng thái
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new AppException(
                    "Không thể chuyển trạng thái đơn hàng từ "
                            + currentStatus + " sang " + newStatus,
                    HttpStatus.BAD_REQUEST);
        }

        // Nếu chuyển sang CANCELLED thì tiến hành hoàn kho nguyên tử, hoàn voucher và hoàn điểm thưởng đã dùng
        if (newStatus == OrderStatus.CANCELLED) {
            if (order.getVoucher() != null) {
                voucherService.refundVoucherUsage(order);
            }
            if (order.getPointsUsed() != null && order.getPointsUsed() > 0 && order.getUser() != null) {
                User orderUser = order.getUser();
                int currentPts = orderUser.getRewardPoints() != null ? orderUser.getRewardPoints() : 0;
                orderUser.setRewardPoints(currentPts + order.getPointsUsed());
                userRepository.save(orderUser);
            }
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
                    int updatedRows = productVariantRepository.incrementStockAtomic(variantId, quantity);
                    if (updatedRows != 1) {
                        throw new AppException(
                                "Không thể hoàn tồn kho cho biến thể sản phẩm ID: " + variantId,
                                HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                }
            }
        }

        // Tích lũy điểm thưởng và chi tiêu khi đơn hàng chuyển sang COMPLETED
        if (newStatus == OrderStatus.COMPLETED && (order.getPointsEarned() == null || order.getPointsEarned() == 0)) {
            if (order.getTotalAmount() != null && order.getUser() != null) {
                int earned = order.getTotalAmount().divide(BigDecimal.valueOf(10000), 0, RoundingMode.FLOOR).intValue();
                order.setPointsEarned(earned);

                User orderUser = order.getUser();
                int currentPts = orderUser.getRewardPoints() != null ? orderUser.getRewardPoints() : 0;
                orderUser.setRewardPoints(currentPts + earned);

                BigDecimal currentSpending = orderUser.getTotalSpending() != null ? orderUser.getTotalSpending() : BigDecimal.ZERO;
                orderUser.setTotalSpending(currentSpending.add(order.getTotalAmount()));
                userRepository.save(orderUser);
            }
        }

        // Cập nhật trạng thái đơn hàng sau khi hoàn kho
        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        // Ghi nhận lịch sử chuyển trạng thái đơn hàng
        OrderStatusHistory updateHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .oldStatus(currentStatus)
                .newStatus(newStatus)
                .changedBy("ADMIN")
                .note("Quản trị viên cập nhật trạng thái từ " + currentStatus + " sang " + newStatus)
                .build();
        orderStatusHistoryRepository.save(updateHistory);

        return OrderResponse.fromEntity(savedOrder);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId) {
        return cancelOrder(orderId, null, true, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId, Long currentUserId, boolean isAdmin) {
        return cancelOrder(orderId, currentUserId, isAdmin, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId, Long currentUserId, boolean isAdmin, String reason) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng với ID: " + orderId));

        // 1. Kiểm tra quyền sở hữu
        if (!isAdmin) {
            if (currentUserId == null || order.getUser() == null || !order.getUser().getId().equals(currentUserId)) {
                throw new AppException("Bạn không có quyền hủy đơn hàng này!", HttpStatus.FORBIDDEN);
            }
        }

        OrderStatus currentStatus = order.getStatus();

        // 2. Chống Double-Click & Lũy đẳng: Nếu đã CANCELLED thì trả 409 CONFLICT
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new AppException("Đơn hàng này đã được hủy trước đó!", HttpStatus.CONFLICT);
        }

        // 3. Kiểm tra trạng thái cho phép hủy
        if (!isAdmin) {
            if (currentStatus != OrderStatus.PENDING) {
                String msg = switch (currentStatus) {
                    case PROCESSING ->
                        "Đơn hàng đang được chuẩn bị đóng gói, không thể tự hủy. Vui lòng liên hệ bộ phận hỗ trợ.";
                    case SHIPPING -> "Đơn hàng đang trong quá trình vận chuyển, không thể hủy.";
                    case COMPLETED -> "Đơn hàng đã hoàn thành, không thể hủy.";
                    default -> "Không thể hủy đơn hàng ở trạng thái hiện tại (" + currentStatus + ").";
                };
                throw new AppException(msg, HttpStatus.BAD_REQUEST);
            }
        } else {
            if (!currentStatus.canTransitionTo(OrderStatus.CANCELLED)) {
                throw new AppException(
                        "Không thể chuyển trạng thái đơn hàng từ " + currentStatus + " sang CANCELLED",
                        HttpStatus.BAD_REQUEST);
            }
        }

        // 4. Hoàn kho nguyên tử phòng vệ (sắp xếp variantId ASC chống Deadlock)
        List<OrderItem> sortedItems = order.getOrderItems()
                .stream()
                .filter(item -> item.getProductVariant() != null && item.getProductVariant().getId() != null)
                .sorted(Comparator.comparing(item -> item.getProductVariant().getId()))
                .toList();

        for (OrderItem item : sortedItems) {
            Long variantId = item.getProductVariant().getId();
            Integer quantity = item.getQuantity();

            if (quantity == null || quantity <= 0) {
                log.warn("Bỏ qua hoàn kho cho orderItem ID: {} vì quantity không hợp lệ: {}", item.getId(), quantity);
                continue;
            }

            int updatedRows = productVariantRepository.incrementStockAtomic(variantId, quantity);
            if (updatedRows != 1) {
                throw new AppException(
                        "Không thể hoàn tồn kho cho biến thể sản phẩm ID: " + variantId,
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        // 5. Cập nhật trạng thái CANCELLED & hoàn lượt voucher nếu có & hoàn điểm thưởng đã dùng
        if (order.getVoucher() != null) {
            voucherService.refundVoucherUsage(order);
        }
        if (order.getPointsUsed() != null && order.getPointsUsed() > 0 && order.getUser() != null) {
            User orderUser = order.getUser();
            int currentPts = orderUser.getRewardPoints() != null ? orderUser.getRewardPoints() : 0;
            orderUser.setRewardPoints(currentPts + order.getPointsUsed());
            userRepository.save(orderUser);
        }
        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // Chuẩn hóa lý do hủy đơn
        String normalizedReason = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : null;
        if (normalizedReason != null && normalizedReason.length() > 255) {
            normalizedReason = normalizedReason.substring(0, 255);
        }

        String historyNote;
        if (normalizedReason != null) {
            historyNote = normalizedReason;
        } else {
            historyNote = isAdmin ? "Quản trị viên hủy đơn hàng" : "Khách hàng tự hủy đơn hàng";
        }

        // Lấy thông tin user an toàn (Zero Lazy-Loading Dependency, chống LazyInitializationException khi tắt OSIV)
        Long orderUserId = (order.getUser() != null) ? order.getUser().getId() : currentUserId;
        String actor = isAdmin ? "ADMIN" : "USER";
        String userEmail = null;

        if (orderUserId != null) {
            Optional<User> userOpt = userRepository.findById(orderUserId);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                if (!isAdmin) {
                    actor = (u.getUsername() != null && !u.getUsername().isBlank()) ? u.getUsername() : u.getEmail();
                }
                userEmail = u.getEmail();
            }
        }

        // Ghi nhận lịch sử hủy đơn hàng
        OrderStatusHistory cancelHistory = OrderStatusHistory.builder()
                .order(savedOrder)
                .oldStatus(currentStatus)
                .newStatus(OrderStatus.CANCELLED)
                .changedBy(actor)
                .note(historyNote)
                .build();
        orderStatusHistoryRepository.save(cancelHistory);

        // 6. Đóng gói Event DTO phẳng (Zero Lazy-Loading Dependency)
        OrderCancelledEvent event = OrderCancelledEvent.builder()
                .orderId(savedOrder.getId())
                .userId(orderUserId)
                .customerName(savedOrder.getCustomerName())
                .userEmail(userEmail)
                .phone(savedOrder.getPhone())
                .totalAmount(savedOrder.getTotalAmount())
                .cancellationSource(isAdmin ? "ADMIN" : "USER")
                .cancelReason(normalizedReason)
                .cancelledAt(LocalDateTime.now())
                .build();

        eventPublisher.publishEvent(event);

        OrderResponse response = OrderResponse.fromEntity(savedOrder);
        response.setCancelReason(normalizedReason != null ? normalizedReason : historyNote);
        return response;
    }

    @Override
    public List<OrderResponse> getMyOrdersList(Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);

        return orders.stream()
                .sorted(
                        Comparator.comparing(
                                Order::getCreatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(OrderResponse::fromEntity)
                .peek(this::enrichCancelReason)
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
                .map(OrderResponse::fromEntity)
                .map(res -> {
                    enrichCancelReason(res);
                    return res;
                });
    }

    @Override
    public OrderResponse getOrderById(Long orderId, Long userId, boolean isAdmin) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!isAdmin && !order.getUser().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền xem thông tin đơn hàng này!", HttpStatus.FORBIDDEN);
        }

        OrderResponse response = OrderResponse.fromEntity(order);
        enrichCancelReason(response);
        return response;
    }

    private void enrichCancelReason(OrderResponse response) {
        if (response != null && response.getStatus() == OrderStatus.CANCELLED && response.getId() != null) {
            orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(response.getId()).stream()
                    .filter(h -> h.getNewStatus() == OrderStatus.CANCELLED)
                    .reduce((first, second) -> second)
                    .ifPresent(h -> response.setCancelReason(h.getNote()));
        }
    }

    @Override
    public List<OrderStatusHistoryResponse> getOrderTimeline(Long orderId, Long currentUserId, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!isAdmin && (order.getUser() == null || !order.getUser().getId().equals(currentUserId))) {
            throw new AppException("Bạn không có quyền xem thông tin dòng thời gian của đơn hàng này!", HttpStatus.FORBIDDEN);
        }

        return orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(OrderStatusHistoryResponse::fromEntity)
                .toList();
    }
}
