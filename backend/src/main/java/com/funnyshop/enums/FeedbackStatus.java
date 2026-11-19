package com.funnyshop.enums;

import lombok.Getter;

@Getter
public enum FeedbackStatus {
    PENDING("Chờ phản hồi"),
    PROCESSING("Đang xử lý"),
    REPLIED("Đã trả lời"),
    CLOSED("Đã đóng");

    private final String label;

    FeedbackStatus(String label) {
        this.label = label;
    }
}

