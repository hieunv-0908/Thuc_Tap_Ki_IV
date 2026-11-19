package com.funnyshop.dto.response;

import com.funnyshop.enums.FeedbackStatus;
import com.funnyshop.enums.FeedbackType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {

    private Long id;

    // User info
    private Long userId;
    private String username;
    private String userFullName;
    private String userEmail;

    // Feedback content
    private String title;
    private String content;
    private FeedbackType type;
    private String typeLabel;
    private FeedbackStatus status;
    private String statusLabel;

    // Admin reply
    private String adminReply;
    private Long repliedById;
    private String repliedByName;
    private LocalDateTime repliedAt;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

