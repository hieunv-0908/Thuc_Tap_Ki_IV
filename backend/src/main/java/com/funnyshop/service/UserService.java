package com.funnyshop.service;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse getCurrentUserProfile(Long userId);

    UserResponse updateUserProfile(Long userId, UserUpdateRequest request);

    // --ADMIN--
    // Lấy danh sách người dùng, tìm kiếm và phân trang
    Page<UserResponse> getAllUsers(String keyword, Pageable pageable);

    // Lấy chi tiết người dùng theo ID
    UserResponse getUserById(Long id);

    // Cập nhật thông tin người dùng
    UserResponse updateUser(Long id, UserUpdateRequest request);

    // Khóa hoặc mở khóa tài khoản
    UserResponse updateUserStatus(Long id, User.Status status);

    // Xóa người dùng
    void deleteUser(Long id);
}
