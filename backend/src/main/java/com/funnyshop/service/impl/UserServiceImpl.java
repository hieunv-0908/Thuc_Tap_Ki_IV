package com.funnyshop.service.impl;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;

import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getCurrentUserProfile(Long userId) {
        log.info("Getting user profile for userId: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với ID: " + userId));

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserProfile(Long userId, UserUpdateRequest request) {
        log.info("Updating user profile for userId: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với ID: " + userId));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        User updatedUser = userRepository.save(user);
        log.info("User profile updated successfully for userId: {}", userId);

        return mapToUserResponse(updatedUser);
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
