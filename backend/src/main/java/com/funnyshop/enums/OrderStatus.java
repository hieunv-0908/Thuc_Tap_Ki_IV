package com.funnyshop.enums;

public enum OrderStatus {
    PENDING,
    PROCESSING,
    SHIPPING,
    COMPLETED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURNING,
    RETURNED,
    RETURN_REJECTED;  // Yêu cầu trả hàng bị từ chối (trạng thái riêng)

    public boolean canTransitionTo(OrderStatus next) {
        if (next == null) {
            return false;
        }

        return switch (this) {
            case PENDING -> next == PROCESSING || next == CANCELLED;
            case PROCESSING -> next == SHIPPING || next == CANCELLED;
            case SHIPPING -> next == COMPLETED;
            case COMPLETED -> next == RETURN_REQUESTED;
            // RETURN_REJECTED: khách có thể gửi lại yêu cầu mới -> RETURN_REQUESTED
            case RETURN_REQUESTED -> next == RETURNING || next == RETURN_REJECTED || next == RETURNED;
            case RETURN_REJECTED -> next == RETURN_REQUESTED; // Cho phép gửi yêu cầu mới
            case RETURNING -> next == RETURNED;
            case RETURNED, CANCELLED -> false;
        };
    }
}
