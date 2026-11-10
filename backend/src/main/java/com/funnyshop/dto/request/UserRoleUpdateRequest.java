package com.funnyshop.dto.request;

import com.funnyshop.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRoleUpdateRequest {

    @NotNull(message = "Vai trò không được để trống!")
    private User.Role role;
}
