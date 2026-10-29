package com.funnyshop.service;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;

public interface UserService {
    UserResponse getCurrentUserProfile(Long userId);
    UserResponse updateUserProfile(Long userId, UserUpdateRequest request);
}
