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
    @DisplayName("SHIPPING chỉ được chuyển sang COMPLETED")
    void shippingTransitions() {
        assertTrue(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.COMPLETED));
        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.CANCELLED));

        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.PROCESSING));
        assertFalse(OrderStatus.SHIPPING.canTransitionTo(OrderStatus.SHIPPING));
    }

    @Test
    @DisplayName("COMPLETED có thể chuyển sang RETURN_REQUESTED")
    void completedTransitions() {
        assertTrue(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.RETURN_REQUESTED));
        assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.PROCESSING));
        assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.SHIPPING));
        assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.RETURNED));
    }

    @Test
    @DisplayName("RETURN_REQUESTED có thể chuyển sang RETURNING, RETURN_REJECTED hoặc RETURNED")
    void returnRequestedTransitions() {
        assertTrue(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.RETURNING));
        assertTrue(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.RETURN_REJECTED));
        assertTrue(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.RETURNED));
        assertFalse(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.COMPLETED));
        assertFalse(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.SHIPPING));
        assertFalse(OrderStatus.RETURN_REQUESTED.canTransitionTo(OrderStatus.CANCELLED));
    }

    @Test
    @DisplayName("RETURN_REJECTED có thể chuyển sang RETURN_REQUESTED khi khách gửi lại yêu cầu")
    void returnRejectedTransitions() {
        assertTrue(OrderStatus.RETURN_REJECTED.canTransitionTo(OrderStatus.RETURN_REQUESTED));
        assertFalse(OrderStatus.RETURN_REJECTED.canTransitionTo(OrderStatus.RETURNING));
        assertFalse(OrderStatus.RETURN_REJECTED.canTransitionTo(OrderStatus.RETURNED));
        assertFalse(OrderStatus.RETURN_REJECTED.canTransitionTo(OrderStatus.COMPLETED));
        assertFalse(OrderStatus.RETURN_REJECTED.canTransitionTo(OrderStatus.PENDING));
    }

    @Test
    @DisplayName("RETURNING chỉ có thể chuyển sang RETURNED")
    void returningTransitions() {
        assertTrue(OrderStatus.RETURNING.canTransitionTo(OrderStatus.RETURNED));
        assertFalse(OrderStatus.RETURNING.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.RETURNING.canTransitionTo(OrderStatus.PROCESSING));
        assertFalse(OrderStatus.RETURNING.canTransitionTo(OrderStatus.COMPLETED));
    }

    @Test
    @DisplayName("RETURNED và CANCELLED là trạng thái kết thúc, không được chuyển sang trạng thái nào")
    void terminalStates() {
        for (OrderStatus target : OrderStatus.values()) {
            assertFalse(OrderStatus.RETURNED.canTransitionTo(target));
            assertFalse(OrderStatus.CANCELLED.canTransitionTo(target));
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

