package com.funnyshop.enums;

public enum OrderStatus {
    PENDING,
    PROCESSING,
    SHIPPING,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus next) {
        if (next == null) {
            return false;
        }
        return switch (this) {
            case PENDING -> next == PROCESSING || next == CANCELLED;
            case PROCESSING -> next == SHIPPING || next == CANCELLED;
            case SHIPPING -> next == COMPLETED || next == CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}

