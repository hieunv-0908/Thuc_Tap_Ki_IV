package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.ReturnReviewRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ReturnResponse;
import com.funnyshop.enums.ReturnStatus;
import com.funnyshop.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin/returns", "/api/admin/returns"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnController {

    private final ReturnService returnService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReturnResponse>>> getAllReturns(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ReturnStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ReturnResponse> returns = returnService.getAllReturnRequests(keyword, status, pageable);

        return ResponseEntity.ok(
                ApiResponse.<Page<ReturnResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách yêu cầu trả hàng thành công!")
                        .data(returns)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnResponse>> getReturnById(@PathVariable Long id) {
        ReturnResponse response = returnService.getReturnRequestById(id);

        return ResponseEntity.ok(
                ApiResponse.<ReturnResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin yêu cầu trả hàng thành công!")
                        .data(response)
                        .build()
        );
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<ReturnResponse>> reviewReturn(
            @PathVariable Long id,
            @Valid @RequestBody ReturnReviewRequest request) {

        ReturnResponse response = returnService.reviewReturnRequest(id, request);

        return ResponseEntity.ok(
                ApiResponse.<ReturnResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã xử lý xét duyệt yêu cầu trả hàng thành công!")
                        .data(response)
                        .build()
        );
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ReturnResponse>> completeReturn(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        String note = (body != null) ? body.get("note") : null;
        ReturnResponse response = returnService.completeReturn(id, note);

        return ResponseEntity.ok(
                ApiResponse.<ReturnResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã hoàn tất quy trình nhận hàng hoàn và hoàn tiền!")
                        .data(response)
                        .build()
        );
    }
}

