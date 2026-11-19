package com.funnyshop.dto.request;

import com.funnyshop.enums.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackCreateRequest {

    @NotBlank(message = "Tiêu đề góp ý không được để trống!")
    @Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự!")
    private String title;

    @NotBlank(message = "Nội dung góp ý không được để trống!")
    private String content;

    private FeedbackType type;
}

