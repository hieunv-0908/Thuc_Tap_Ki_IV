package com.funnyshop.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderStatusTest {

    @Test
    @DisplayName("PENDING chỉ được chuyển sang PROCESSING hoặc CANCELLED")
    void pendingTransitions() {
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.PROCESSING));
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED));

        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.SHIPPING));
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.COMPLETED));
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.PENDING.canTransitionTo(null));
    }

    @Test
    @DisplayName("PROCESSING chỉ được chuyển sang SHIPPING hoặc CANCELLED")
    void processingTransitions() {
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.SHIPPING));
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.CANCELLED));

        assertFalse(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.COMPLETED));
        assertFalse(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.PROCESSING));
    }

    @Test
    @DisplayName("SHIPPING chỉ được chuyển sang COMPLETED hoặc CANCELLED")
    void shippingTransitions() {
        assertTrue(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.COMPLETED));
        assertTrue(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.CANCELLED));

        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.PROCESSING));
        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.SHIPPING));
    }

    @Test
    @DisplayName("COMPLETED là trạng thái kết thúc, không được chuyển sang trạng thái nào")
    void completedTerminalState() {
        for (OrderStatus target : OrderStatus.values()) {
            assertFalse(OrderStatus.COMPLETED.canTransitionTo(target));
        }
    }

    @Test
    @DisplayName("CANCELLED là trạng thái kết thúc, không được chuyển sang trạng thái nào")
    void cancelledTerminalState() {
        for (OrderStatus target : OrderStatus.values()) {
            assertFalse(OrderStatus.CANCELLED.canTransitionTo(target));
        }
    }
}

