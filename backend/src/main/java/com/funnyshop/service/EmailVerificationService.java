package com.funnyshop.service;

public interface EmailVerificationService {
    boolean checkEmailExists(String email);
    void sendRegistrationOtp(String email, String fullName);
    void verifyRegistrationOtp(String email, String otp);
}

