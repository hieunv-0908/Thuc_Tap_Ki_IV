package com.funnyshop.controller;

import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private OrderController orderController;

    private User sampleUser;
    private OrderResponse sampleOrder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleUser = User.builder()
                .id(2L)
                .username("customer1")
                .role(User.Role.CUSTOMER)
                .build();

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(sampleUser, null, sampleUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        sampleOrder = OrderResponse.builder()
                .id(10L)
                .userId(2L)
                .customerName("Nguyen Van A")
                .totalAmount(new BigDecimal("350000.00"))
                .status(OrderStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/orders/my-orders - Customer lấy danh sách đơn cá nhân thành công")
    void getMyOrders_Success() throws Exception {
        when(orderService.getMyOrdersList(2L)).thenReturn(List.of(sampleOrder));

        mockMvc.perform(get("/api/v1/orders/my-orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Lấy lịch sử đơn hàng thành công!")))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(10)));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} - Customer xem chi tiết đơn hàng của mình thành công")
    void getOrderById_OwnOrder_Success() throws Exception {
        when(orderService.getOrderById(eq(10L), eq(2L), eq(false))).thenReturn(sampleOrder);

        mockMvc.perform(get("/api/v1/orders/10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.id", is(10)));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} - Customer xem đơn của người khác bị trả lỗi 403 Forbidden")
    void getOrderById_OtherOrder_ThrowsForbidden() throws Exception {
        when(orderService.getOrderById(eq(99L), eq(2L), eq(false)))
                .thenThrow(new AppException("Bạn không có quyền truy cập đơn hàng này!", HttpStatus.FORBIDDEN));

        mockMvc.perform(get("/api/v1/orders/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is(403)))
                .andExpect(jsonPath("$.message", is("Bạn không có quyền truy cập đơn hàng này!")));
    }
}

