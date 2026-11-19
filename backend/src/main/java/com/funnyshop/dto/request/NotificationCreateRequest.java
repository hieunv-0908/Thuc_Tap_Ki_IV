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
public class NotificationCreateRequest {

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String content;

    @NotNull(message = "Vui lòng chọn loại thông báo")
    private NotificationType type;

    @NotNull(message = "Vui lòng chọn đối tượng nhận thông báo")
    private NotificationTarget target;

    private Long userId; // Dành cho đối tượng SPECIFIC

    private String targetUrl; // Link dẫn tới ưu đãi, voucher, sản phẩm

    private String imageUrl; // Ảnh đính kèm

    @Builder.Default
    private Boolean isActive = true; // Bật phát sóng ngay
}

