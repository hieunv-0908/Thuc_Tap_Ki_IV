package com.funnyshop.dto.request;

import com.funnyshop.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateRequest {

    @NotNull(message = "Trạng thái tài khoản không được để trống")
    private User.Status status;
}