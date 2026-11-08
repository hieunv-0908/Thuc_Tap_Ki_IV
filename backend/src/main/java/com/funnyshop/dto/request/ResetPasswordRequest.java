package com.funnyshop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Reset token không được để trống")
    private String resetToken;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100,
            message = "Mật khẩu phải từ 8 đến 100 ký tự")
    private String newPassword;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu")
    private String confirmPassword;
}
