package com.funnyshop.enums;

public enum ReturnStatus {
    PENDING,    // Chờ Admin xét duyệt
    APPROVED,   // Admin đã chấp thuận, chờ khách gửi hàng
    REJECTED,   // Admin từ chối yêu cầu
    COMPLETED   // Đã nhận lại hàng & hoàn tất hoàn tiền / hoàn kho
}

