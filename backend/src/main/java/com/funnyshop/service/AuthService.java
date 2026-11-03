package com.funnyshop.service;

import com.funnyshop.dto.request.LoginRequest;
import com.funnyshop.dto.request.RefreshTokenRequest;
import com.funnyshop.dto.request.RegisterRequest;
import com.funnyshop.dto.response.AuthResponse;
import com.funnyshop.dto.response.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest registerRequest);
    AuthResponse login(LoginRequest loginRequest);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String accessToken, String refreshToken);
}
