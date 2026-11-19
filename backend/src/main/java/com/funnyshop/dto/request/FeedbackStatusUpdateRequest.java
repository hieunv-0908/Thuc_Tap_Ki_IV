package com.funnyshop.dto.request;

import com.funnyshop.enums.FeedbackStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackStatusUpdateRequest {

    @NotNull(message = "Trạng thái không được để trống!")
    private FeedbackStatus status;
}

