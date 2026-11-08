package com.funnyshop.service;

public interface PasswordResetService {

    void forgotPassword(String email);

    String verifyOtp(String email, String otp);

    void resetPassword(
            String resetToken,
            String newPassword,
            String confirmPassword
    );
}
