package com.funnyshop.event.listener;

import com.funnyshop.event.OrderCancelledEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
public class OrderEventListener {

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCancelled(OrderCancelledEvent event) {
        log.info("[EventAsync] Bắt đầu xử lý hậu kỳ cho đơn hàng bị hủy #{}. Khách hàng: {}, Email: {}, Nguồn hủy: {}",
                event.getOrderId(), event.getCustomerName(), event.getUserEmail(), event.getCancellationSource());

        try {
            // Điểm kết nối mở rộng trong tương lai:
            // 1. Gửi email xác nhận hủy đơn (JavaMailSender)
            // 2. Bắn thông báo Push/Websocket cho Admin
            // 3. Ghi log Audit/Lịch sử đơn hàng
            log.info("[EventAsync] Hoàn tất xử lý hậu kỳ đơn hàng #{}", event.getOrderId());
        } catch (Exception ex) {
            log.error("[EventAsync] Lỗi khi xử lý tác vụ hậu kỳ hủy đơn #{}: {}", event.getOrderId(), ex.getMessage(), ex);
        }
    }
}

