package com.funnyshop.service.impl;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(Long userId) {
        log.info("Getting user profile for userId: {}", userId);

        User user = findUserById(userId);

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserProfile(Long userId, UserUpdateRequest request) {
        log.info("Updating user profile for userId: {}", userId);

        User user = findUserById(userId);

        updateUserFields(user, request);

        User updatedUser = userRepository.save(user);

        log.info("User profile updated successfully for userId: {}", userId);

        return mapToUserResponse(updatedUser);
    }

    // ================= ADMIN =================

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(String keyword, Pageable pageable) {
        Page<User> users;

        if (keyword == null || keyword.trim().isEmpty()) {
            users = userRepository.findAll(pageable);
        } else {
            users = userRepository
                    .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                            keyword.trim(),
                            keyword.trim(),
                            keyword.trim(),
                            pageable
                    );
        }

        return users.map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = findUserById(id);

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        log.info("Admin updating user with ID: {}", id);

        User user = findUserById(id);

        updateUserFields(user, request);

        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, User.Status status) {
        log.info("Updating status for userId: {}", id);

        User user = findUserById(id);
        user.setStatus(status);

        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.info("Soft deleting user with ID: {}", id);

        User user = findUserById(id);

        user.setStatus(User.Status.INACTIVE);

        userRepository.save(user);

        log.info("User soft deleted successfully with ID: {}", id);
    }

    // ================= HELPER METHODS =================

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User không tìm thấy với ID: " + id
                ));
    }

    private void updateUserFields(User user, UserUpdateRequest request) {
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
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
