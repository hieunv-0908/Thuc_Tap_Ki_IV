package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.OrderStatusUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.service.CsvExportService;
import com.funnyshop.service.OrderService;
import com.funnyshop.util.CsvExportUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;

@RestController
@RequestMapping({"/api/v1/admin/orders", "/api/admin/orders"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;
    private final CsvExportService csvExportService;

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
        OrderResponse updatedOrder = request.getStatus() == OrderStatus.CANCELLED
                ? orderService.cancelOrder(id)
                : orderService.updateOrderStatus(id, request.getStatus());

        return ResponseEntity.ok(
                ApiResponse.<OrderResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật trạng thái đơn hàng thành công!")
                        .data(updatedOrder)
                        .build()
        );
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable Long id) {
        OrderResponse cancelledOrder = orderService.cancelOrder(id);

        return ResponseEntity.ok(
                ApiResponse.<OrderResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Hủy đơn hàng và hoàn tồn kho thành công!")
                        .data(cancelledOrder)
                        .build()
        );
    }

    @GetMapping("/export/csv")
    public void exportOrdersCsv(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            HttpServletResponse response
    ) throws IOException {
        String filename = "don_hang_funnyshop_" + CsvExportUtil.formatFileTimestamp(LocalDateTime.now()) + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        csvExportService.exportOrdersToCsv(response.getWriter(), search, status, startDate, endDate);
    }
}
