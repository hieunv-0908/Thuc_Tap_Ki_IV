package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.VoucherCreateRequest;
import com.funnyshop.dto.request.VoucherUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.VoucherResponse;
import com.funnyshop.service.VoucherService;
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

@RestController
@RequestMapping({"/api/v1/admin/vouchers", "/api/admin/vouchers"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VoucherResponse>>> getAllVouchers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<VoucherResponse> vouchers = voucherService.getAllVouchers(search, isActive, pageable);

        return ResponseEntity.ok(
                ApiResponse.<Page<VoucherResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách mã giảm giá thành công!")
                        .data(vouchers)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucherById(@PathVariable Long id) {
        VoucherResponse voucher = voucherService.getVoucherById(id);

        return ResponseEntity.ok(
                ApiResponse.<VoucherResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin mã giảm giá thành công!")
                        .data(voucher)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(
            @Valid @RequestBody VoucherCreateRequest request) {

        VoucherResponse created = voucherService.createVoucher(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<VoucherResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Tạo mã giảm giá mới thành công!")
                        .data(created)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherResponse>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherUpdateRequest request) {

        VoucherResponse updated = voucherService.updateVoucher(id, request);

        return ResponseEntity.ok(
                ApiResponse.<VoucherResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật mã giảm giá thành công!")
                        .data(updated)
                        .build()
        );
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<VoucherResponse>> toggleVoucherStatus(@PathVariable Long id) {
        VoucherResponse toggled = voucherService.toggleVoucherStatus(id);

        return ResponseEntity.ok(
                ApiResponse.<VoucherResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đổi trạng thái mã giảm giá thành công!")
                        .data(toggled)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xóa mã giảm giá thành công!")
                        .build()
        );
    }
}
