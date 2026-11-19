package com.funnyshop.dto.request;

import com.funnyshop.enums.FeedbackStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackReplyRequest {

    @NotBlank(message = "Nội dung trả lời không được để trống!")
    private String reply;

    private FeedbackStatus status;
}

