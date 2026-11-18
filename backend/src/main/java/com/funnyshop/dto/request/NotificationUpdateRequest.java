package com.funnyshop.dto.request;

import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationUpdateRequest {

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String content;

    @NotNull(message = "Vui lòng chọn loại thông báo")
    private NotificationType type;

    @NotNull(message = "Vui lòng chọn đối tượng nhận thông báo")
    private NotificationTarget target;

    private Long userId;

    private String targetUrl;

    private String imageUrl;

    private Boolean isActive;
}

