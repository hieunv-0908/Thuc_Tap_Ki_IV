package com.funnyshop.service.impl;

import com.funnyshop.dto.request.ReturnCreateRequest;
import com.funnyshop.dto.request.ReturnReviewRequest;
import com.funnyshop.dto.response.ReturnResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.OrderStatusHistory;
import com.funnyshop.entity.ReturnRequest;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.enums.ReturnStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.OrderStatusHistoryRepository;
import com.funnyshop.repository.ProductVariantRepository;
import com.funnyshop.repository.ReturnRequestRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.ReturnService;
import com.funnyshop.service.VoucherService;
import com.funnyshop.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnServiceImpl implements ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final VoucherService voucherService;
    private final EmailService emailService;

    private static final int MAX_RETURN_DAYS = 7;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResponse createReturnRequest(Long userId, Long orderId, ReturnCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        // 1. Kiểm tra quyền sở hữu đơn hàng
        boolean isOwner = order.getUser() != null && order.getUser().getId().equals(userId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(String.valueOf(user.getRole()));
        if (!isOwner && !isAdmin) {
            throw new AppException("Bạn không có quyền gửi yêu cầu trả hàng cho đơn hàng này!", HttpStatus.FORBIDDEN);
        }

        // Cũng kiểm tra khi tạo yêu cầu mới: cho phép từ trạng thái RETURN_REJECTED (gửi lại)
        if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.RETURN_REJECTED) {
            throw new AppException(
                    "Chỉ đơn hàng ở trạng thái 'Hoàn thành' hoặc 'Yêu cầu bị từ chối' mới có thể gửi yêu cầu trả hàng!",
                    HttpStatus.BAD_REQUEST
            );
        }

        // 3. Kiểm tra thời hạn đổi trả 7 ngày
        LocalDateTime referenceTime = order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt();
        if (referenceTime != null && LocalDateTime.now().isAfter(referenceTime.plusDays(MAX_RETURN_DAYS))) {
            throw new AppException(
                    "Đơn hàng đã vượt quá thời hạn cho phép đổi trả (" + MAX_RETURN_DAYS + " ngày kể từ khi hoàn thành)!",
                    HttpStatus.BAD_REQUEST
            );
        }

        // 4. Kiểm tra xem đã có yêu cầu trả hàng đang xử lý hoặc đã hoàn tất chưa
        List<ReturnRequest> existingRequests = returnRequestRepository.findByOrderIdOrderByIdDesc(orderId);
        boolean hasActiveRequest = existingRequests.stream()
                .anyMatch(r -> r.getStatus() == ReturnStatus.PENDING ||
                               r.getStatus() == ReturnStatus.APPROVED ||
                               r.getStatus() == ReturnStatus.COMPLETED);
        if (hasActiveRequest) {
            throw new AppException("Đơn hàng này đã có yêu cầu trả hàng đang được xử lý!", HttpStatus.BAD_REQUEST);
        }

        // 5. Chuẩn bị ảnh bằng chứng
        String imagesStr = null;
        if (request.getEvidenceImages() != null && !request.getEvidenceImages().isEmpty()) {
            imagesStr = String.join(",", request.getEvidenceImages());
        }

        // 6. Tạo ReturnRequest
        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .user(user)
                .reason(request.getReason().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .evidenceImages(imagesStr)
                .bankName(request.getBankName() != null ? request.getBankName().trim() : null)
                .bankAccountNumber(request.getBankAccountNumber() != null ? request.getBankAccountNumber().trim() : null)
                .bankAccountName(request.getBankAccountName() != null ? request.getBankAccountName().trim() : null)
                .refundAmount(order.getTotalAmount())
                .status(ReturnStatus.PENDING)
                .build();

        ReturnRequest savedRequest = returnRequestRepository.save(returnRequest);

        // 7. Cập nhật trạng thái đơn hàng sang RETURN_REQUESTED
        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.RETURN_REQUESTED);
        orderRepository.save(order);

        // 8. Ghi nhận lịch sử OrderTimeline
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus(OrderStatus.RETURN_REQUESTED)
                .changedBy(user.getFullName() != null ? user.getFullName() : "Khách hàng")
                .note("Khách hàng gửi yêu cầu trả hàng. Lý do: " + request.getReason())
                .build();
        orderStatusHistoryRepository.save(history);

        log.info("Đã tạo yêu cầu trả hàng #{} cho đơn hàng #{}", savedRequest.getId(), order.getId());
        return ReturnResponse.fromEntity(savedRequest);
    }

    @Override
    public ReturnResponse getReturnRequestByOrderId(Long userId, Long orderId, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!isAdmin && (order.getUser() == null || !order.getUser().getId().equals(userId))) {
            throw new AppException("Bạn không có quyền truy cập thông tin trả hàng của đơn này!", HttpStatus.FORBIDDEN);
        }

        ReturnRequest request = returnRequestRepository.findTopByOrderIdOrderByIdDesc(orderId)
                .orElse(null);

        return ReturnResponse.fromEntity(request);
    }

    @Override
    public ReturnResponse getReturnRequestById(Long returnId) {
        ReturnRequest request = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu trả hàng với ID: " + returnId));
        return ReturnResponse.fromEntity(request);
    }

    @Override
    public Page<ReturnResponse> getAllReturnRequests(String keyword, ReturnStatus status, Pageable pageable) {
        Page<ReturnRequest> page = returnRequestRepository.searchReturns(keyword, status, pageable);
        return page.map(ReturnResponse::fromEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResponse reviewReturnRequest(Long returnId, ReturnReviewRequest request) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu trả hàng với ID: " + returnId));

        if (returnRequest.getStatus() != ReturnStatus.PENDING) {
            throw new AppException("Chỉ có thể xét duyệt yêu cầu trả hàng đang ở trạng thái Chờ duyệt!", HttpStatus.BAD_REQUEST);
        }

        Order order = orderRepository.findByIdForUpdate(returnRequest.getOrder().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng!"));

        String action = request.getAction() != null ? request.getAction().trim().toUpperCase() : "";

        if ("APPROVE".equals(action)) {
            returnRequest.setStatus(ReturnStatus.APPROVED);
            String note = (request.getAdminNote() != null && !request.getAdminNote().isBlank())
                    ? request.getAdminNote().trim()
                    : "Yêu cầu đã được phê duyệt. Vui lòng đóng gói và gửi hàng về kho của FunnyShop.";
            returnRequest.setAdminNote(note);

            OrderStatus oldStatus = order.getStatus();
            order.setStatus(OrderStatus.RETURNING);
            orderRepository.save(order);

            orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                    .order(order).oldStatus(oldStatus).newStatus(OrderStatus.RETURNING)
                    .changedBy("ADMIN")
                    .note("Quản trị viên đã phê duyệt yêu cầu trả hàng. " + note)
                    .build());

            log.info("Admin đã DUYỆT yêu cầu trả hàng #{} cho đơn #{}", returnId, order.getId());

        } else if ("REJECT".equals(action)) {
            if (request.getAdminNote() == null || request.getAdminNote().isBlank()) {
                throw new AppException("Bắt buộc phải nhập lý do khi từ chối yêu cầu trả hàng!", HttpStatus.BAD_REQUEST);
            }

            returnRequest.setStatus(ReturnStatus.REJECTED);
            returnRequest.setAdminNote(request.getAdminNote().trim());

            OrderStatus oldStatus = order.getStatus();
            // Trạng thái đơn riêng: RETURN_REJECTED (không về COMPLETED)
            order.setStatus(OrderStatus.RETURN_REJECTED);
            orderRepository.save(order);

            orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                    .order(order).oldStatus(oldStatus).newStatus(OrderStatus.RETURN_REJECTED)
                    .changedBy("ADMIN")
                    .note("Quản trị viên từ chối yêu cầu trả hàng. Lý do: " + request.getAdminNote().trim())
                    .build());

            log.info("Admin đã TỪ CHỐI yêu cầu trả hàng #{} cho đơn #{}", returnId, order.getId());

        } else {
            throw new AppException("Hành động không hợp lệ! Chỉ chấp nhận APPROVE hoặc REJECT.", HttpStatus.BAD_REQUEST);
        }

        // Lưu ReturnRequest một lần duy nhất
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // Gửi email thông báo sau khi persist (fire-and-forget, lỗi không rollback)
        try {
            if ("APPROVE".equals(action)) emailService.sendReturnApprovedEmail(saved);
            else if ("REJECT".equals(action)) emailService.sendReturnRejectedEmail(saved);
        } catch (Exception e) {
            log.warn("[Email] Không thể gửi email review trả hàng #{}: {}", returnId, e.getMessage());
        }

        return ReturnResponse.fromEntity(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResponse completeReturn(Long returnId, String note) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu trả hàng với ID: " + returnId));

        if (returnRequest.getStatus() != ReturnStatus.APPROVED && returnRequest.getStatus() != ReturnStatus.PENDING) {
            throw new AppException("Chỉ có thể hoàn tất yêu cầu trả hàng đã được phê duyệt!", HttpStatus.BAD_REQUEST);
        }

        Order order = orderRepository.findByIdForUpdate(returnRequest.getOrder().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng!"));

        // 1. Hoàn lại tồn kho nguyên tử cho các sản phẩm trong đơn (Sắp xếp theo ID tăng dần tránh deadlock)
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

        // 2. Hoàn lượt dùng voucher nếu có
        if (order.getVoucher() != null) {
            try {
                voucherService.refundVoucherUsage(order);
            } catch (Exception e) {
                log.warn("Không thể hoàn voucher khi trả hàng đơn #{}: {}", order.getId(), e.getMessage());
            }
        }

        // 3. Cập nhật trạng thái đơn hàng sang RETURNED và REFUNDED
        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.RETURNED);
        order.setPaymentStatus("REFUNDED");
        orderRepository.save(order);

        // 4. Cập nhật ReturnRequest sang COMPLETED
        returnRequest.setStatus(ReturnStatus.COMPLETED);
        if (note != null && !note.isBlank()) {
            returnRequest.setAdminNote(
                    (returnRequest.getAdminNote() != null ? returnRequest.getAdminNote() + " | " : "") + note.trim()
            );
        }
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // 5. Ghi nhận lịch sử OrderTimeline
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus(OrderStatus.RETURNED)
                .changedBy("ADMIN")
                .note("Đã nhận hàng hoàn về kho và xác nhận hoàn tất quy trình trả hàng / hoàn tiền.")
                .build();
        orderStatusHistoryRepository.save(history);

        log.info("Đã hoàn tất quy trình trả hàng cho yêu cầu #{} và đơn #{}", returnId, order.getId());
        return ReturnResponse.fromEntity(saved);
    }
}

