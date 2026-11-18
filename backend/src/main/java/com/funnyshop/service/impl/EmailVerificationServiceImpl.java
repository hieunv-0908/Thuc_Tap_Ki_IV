package com.funnyshop.service.impl;

import com.funnyshop.entity.EmailVerificationToken;
import com.funnyshop.exception.AppException;
import com.funnyshop.repository.EmailVerificationTokenRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.EmailVerificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.password-reset.otp-expiration-minutes:5}")
    private long otpExpirationMinutes;

    @Value("${app.password-reset.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.password-reset.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    @Override
    @Transactional(readOnly = true)
    public boolean checkEmailExists(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return userRepository.existsByEmailIgnoreCase(email.trim());
    }

    @Override
    @Transactional
    public void sendRegistrationOtp(String email, String fullName) {
        if (email == null || email.isBlank()) {
            throw new AppException("Email không được để trống!", HttpStatus.BAD_REQUEST);
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Kiểm tra email đã được đăng ký chưa trước khi gửi OTP
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException("Email này đã được đăng ký tài khoản! Vui lòng sử dụng email khác hoặc Đăng nhập.", HttpStatus.CONFLICT);
        }

        // Kiểm tra cooldown (tránh spam)
        var latest = tokenRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);
        if (latest.isPresent()
                && latest.get().getCreatedAt()
                .plusSeconds(resendCooldownSeconds)
                .isAfter(LocalDateTime.now())) {
            log.info("[EmailVerification] OTP resend cooldown active for email: {}", normalizedEmail);
            throw new AppException(
                    "Vui lòng chờ " + resendCooldownSeconds + " giây trước khi gửi lại mã OTP.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Xóa token cũ
        tokenRepository.deleteAllByEmail(normalizedEmail);

        // Sinh OTP 6 chữ số
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));

        // Lưu token đã hash
        EmailVerificationToken token = EmailVerificationToken.builder()
                .email(normalizedEmail)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .verified(false)
                .attempts(0)
                .build();
        tokenRepository.save(token);

        // Gửi email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(normalizedEmail);
            message.setSubject("FunnyShop - Mã xác nhận đăng ký tài khoản");

            String greeting = (fullName != null && !fullName.isBlank()) ? fullName.trim() : "bạn";
            message.setText(
                    "Xin chào " + greeting + ",\n\n"
                            + "Mã OTP xác nhận đăng ký tài khoản FunnyShop của bạn là:\n\n"
                            + "    " + otp + "\n\n"
                            + "Mã OTP có hiệu lực trong " + otpExpirationMinutes + " phút.\n"
                            + "Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n"
                            + "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.\n\n"
                            + "Trân trọng,\nFunnyShop"
            );
            mailSender.send(message);
            log.info("[EmailVerification] OTP sent to: {}", normalizedEmail);
        } catch (MailException e) {
            log.error("[EmailVerification] Cannot send OTP email to {}: {}", normalizedEmail, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể gửi email lúc này. Vui lòng thử lại sau."
            );
        }
    }

    @Override
    @Transactional
    public void verifyRegistrationOtp(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new AppException("Email không được để trống!", HttpStatus.BAD_REQUEST);
        }

        String normalizedEmail = email.trim().toLowerCase();

        EmailVerificationToken token = tokenRepository
                .findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new AppException(
                        "Không tìm thấy mã OTP hợp lệ cho email này. Vui lòng gửi lại mã.",
                        HttpStatus.BAD_REQUEST
                ));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.", HttpStatus.BAD_REQUEST);
        }

        if (token.getAttempts() >= maxAttempts) {
            throw new AppException(
                    "Bạn đã nhập sai OTP quá " + maxAttempts + " lần. Vui lòng gửi lại mã mới.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Tăng số lần thử
        token.setAttempts(token.getAttempts() + 1);
        tokenRepository.save(token);

        if (!passwordEncoder.matches(otp, token.getOtpHash())) {
            throw new AppException(
                    "Mã OTP không chính xác. Còn " + (maxAttempts - token.getAttempts()) + " lần thử.",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Đánh dấu đã xác thực
        token.setVerified(true);
        tokenRepository.save(token);
        log.info("[EmailVerification] Email verified successfully: {}", normalizedEmail);
    }
}

