package com.funnyshop.controller.admin;

import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminOrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private AdminOrderController adminOrderController;

    private OrderResponse sampleOrder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminOrderController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleOrder = OrderResponse.builder()
                .id(1L)
                .userId(2L)
                .customerName("Nguyen Van A")
                .totalAmount(new BigDecimal("500000.00"))
                .status(OrderStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/orders - Admin lấy danh sách toàn bộ đơn hàng thành công")
    void getAllOrders_Success() throws Exception {
        when(orderService.getAllOrders(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(sampleOrder), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/admin/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.content[0].id", is(1)))
                .andExpect(jsonPath("$.data.content[0].customerName", is("Nguyen Van A")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/orders/{id}/status - Cập nhật trạng thái hợp lệ thành công")
    void updateOrderStatus_Success() throws Exception {
        OrderResponse updated = OrderResponse.builder()
                .id(1L)
                .userId(2L)
                .customerName("Nguyen Van A")
                .status(OrderStatus.PROCESSING)
                .build();

        when(orderService.updateOrderStatus(eq(1L), eq(OrderStatus.PROCESSING))).thenReturn(updated);

        String json = """
            {
                "status": "PROCESSING"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.status", is("PROCESSING")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/orders/{id}/status - Chuyển trạng thái sai quy tắc trả về lỗi 400")
    void updateOrderStatus_InvalidTransition_Returns400() throws Exception {
        when(orderService.updateOrderStatus(eq(1L), eq(OrderStatus.COMPLETED)))
                .thenThrow(new AppException("Không thể chuyển trạng thái từ PENDING sang COMPLETED", HttpStatus.BAD_REQUEST));

        String json = """
            {
                "status": "COMPLETED"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(400)))
                .andExpect(jsonPath("$.message", is("Không thể chuyển trạng thái từ PENDING sang COMPLETED")));
    }
}
