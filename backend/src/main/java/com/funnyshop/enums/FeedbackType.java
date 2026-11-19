package com.funnyshop.enums;

import lombok.Getter;

@Getter
public enum FeedbackType {
    BUG("Báo lỗi hệ thống"),
    FEATURE("Đề xuất tính năng"),
    SERVICE("Dịch vụ & Hỗ trợ"),
    OTHER("Ý kiến khác");

    private final String label;

    FeedbackType(String label) {
        this.label = label;
    }
}

