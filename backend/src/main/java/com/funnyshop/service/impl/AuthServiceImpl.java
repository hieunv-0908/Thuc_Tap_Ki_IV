package com.funnyshop.service.impl;

import com.funnyshop.dto.request.LoginRequest;
import com.funnyshop.dto.request.RegisterRequest;
import com.funnyshop.dto.response.AuthResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.ResourceAlreadyExistsException;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public UserResponse register(RegisterRequest registerRequest) {
        log.info("Registering new user with username: {}", registerRequest.getUsername());

        // Kiểm tra trùng lặp username
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ResourceAlreadyExistsException("Username đã tồn tại!");
        }

        // Kiểm tra trùng lặp email
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ResourceAlreadyExistsException("Email đã tồn tại!");
        }

        // Tạo user mới
        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName())
                .phone(registerRequest.getPhone())
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build();

        // Lưu vào database
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Chuyển đổi sang UserResponse (không bao gồm password)
        return mapToUserResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        log.info("Attempting login for username: {}", loginRequest.getUsername());

        // Xác thực username và password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        // Lấy user details từ authentication
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User không tìm thấy!"));

        // Sinh JWT Token
        String token = jwtTokenProvider.generateToken(user, user.getId(), user.getRole().name());

        log.info("User logged in successfully: {}", loginRequest.getUsername());

        // Trả về AuthResponse
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(86400000L) // 24 giờ
                .user(mapToUserResponse(user))
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }
}
