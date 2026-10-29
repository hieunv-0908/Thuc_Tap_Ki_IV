package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.OrderStatusUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/orders", "/api/admin/orders"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<OrderResponse> orders = orderService.getAllOrders(page, size);

        return ResponseEntity.ok(
                ApiResponse.<Page<OrderResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách tất cả đơn hàng thành công!")
                        .data(orders)
                        .build()
        );
    }

    @RequestMapping(value = {"/{id}/status", "/{id}"}, method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        OrderResponse updatedOrder = orderService.updateOrderStatus(id, request.getStatus());

        return ResponseEntity.ok(
                ApiResponse.<OrderResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật trạng thái đơn hàng thành công!")
                        .data(updatedOrder)
                        .build()
        );
    }
}

