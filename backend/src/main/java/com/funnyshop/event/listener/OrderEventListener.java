package com.funnyshop.event.listener;

import com.funnyshop.event.OrderCancelledEvent;
import com.funnyshop.event.OrderCreatedEvent;
import com.funnyshop.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * OrderEventListener
 *
 * Lắng nghe các sự kiện vòng đời đơn hàng.
 * Chạy hoàn toàn ở thread pool nền (eventTaskExecutor) SAU KHI Transaction đã commit thành công.
 * Đảm bảo:
 *   1. Không giữ kết nối Database connection pool (HikariCP).
 *   2. Thời gian phản hồi API checkout/cancel cực nhanh (< 100ms).
 *   3. Không bao giờ làm rollback đơn hàng nếu mạng SMTP gặp sự cố.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventListener {

    private final EmailService emailService;

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("[EventAsync] Bắt đầu gửi email xác nhận cho đơn hàng mới #{} (Khách hàng: {}, Email: {})",
                event.getOrderId(), event.getCustomerName(), event.getUserEmail());

        try {
            emailService.sendOrderConfirmationEmail(event);
            log.info("[EventAsync] Hoàn tất gửi email xác nhận cho đơn hàng #{}", event.getOrderId());
        } catch (Exception ex) {
            log.error("[EventAsync] Lỗi khi gửi email xác nhận đơn #{}: {}", event.getOrderId(), ex.getMessage(), ex);
        }
    }

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCancelled(OrderCancelledEvent event) {
        log.info("[EventAsync] Bắt đầu xử lý hậu kỳ & gửi thông báo hủy cho đơn hàng #{}. Nguồn hủy: {}",
                event.getOrderId(), event.getCancellationSource());

        try {
            emailService.sendOrderCancelledEmail(event);
            log.info("[EventAsync] Hoàn tất xử lý hậu kỳ đơn hàng bị hủy #{}", event.getOrderId());
        } catch (Exception ex) {
            log.error("[EventAsync] Lỗi khi xử lý tác vụ hậu kỳ hủy đơn #{}: {}", event.getOrderId(), ex.getMessage(), ex);
        }
    }
}
