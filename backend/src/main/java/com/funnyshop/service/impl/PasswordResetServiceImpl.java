package com.funnyshop.service.impl;

import com.funnyshop.entity.PasswordResetToken;
import com.funnyshop.entity.User;
import com.funnyshop.repository.PasswordResetTokenRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.PasswordResetService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.password-reset.otp-expiration-minutes:5}")
    private long otpExpirationMinutes;

    @Value("${app.password-reset.token-expiration-minutes:10}")
    private long tokenExpirationMinutes;

    @Value("${app.password-reset.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.password-reset.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    // 1. Gửi OTP về email
    @Override
    @Transactional
    public void forgotPassword(String email) {

        User user = userRepository.findByEmail(email)
                .orElse(null);

        // Không tiết lộ email có tồn tại hay không
        if (user == null) {
            log.info("Password reset requested for an unregistered email");
            return;
        }

        // Kiểm tra thời gian chờ gửi lại OTP
        var latest = tokenRepository
                .findTopByUser_EmailOrderByCreatedAtDesc(email);

        if (latest.isPresent()
                && latest.get().getCreatedAt()
                .plusSeconds(resendCooldownSeconds)
                .isAfter(LocalDateTime.now())) {

            log.info("Password reset OTP resend cooldown is active");
            return;
        }

        // Xóa OTP cũ
        tokenRepository.deleteAllByUser_Id(user.getId());

        // Sinh OTP gồm 6 chữ số
        String otp = String.format(
                "%06d",
                RANDOM.nextInt(1_000_000)
        );

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(LocalDateTime.now()
                        .plusMinutes(otpExpirationMinutes))
                .verified(false)
                .attempts(0)
                .build();

        tokenRepository.save(token);

        // Gửi email OTP
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(senderEmail);
            message.setTo(user.getEmail());
            message.setSubject("FunnyShop - Mã xác nhận đặt lại mật khẩu");

            message.setText(
                    "Xin chào " + user.getFullName() + ",\n\n"
                            + "Mã OTP đặt lại mật khẩu của bạn là: "
                            + otp + "\n\n"
                            + "Mã OTP có hiệu lực trong "
                            + otpExpirationMinutes + " phút.\n"
                            + "Không chia sẻ mã này với bất kỳ ai.\n\n"
                            + "Trân trọng,\nFunnyShop"
            );

            mailSender.send(message);

            log.info("Password reset email sent successfully");

        } catch (MailException e) {

            log.error("Cannot send password reset email", e);

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể gửi email lúc này. Vui lòng thử lại sau."
            );
        }
    }

    // 2. Xác thực OTP
    @Override
    @Transactional
    public String verifyOtp(String email, String otp) {

        PasswordResetToken token = tokenRepository
                .findTopByUser_EmailAndVerifiedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "OTP không hợp lệ hoặc đã hết hạn"
                ));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP đã hết hạn"
            );
        }

        if (token.getAttempts() >= maxAttempts) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã nhập sai OTP quá số lần cho phép"
            );
        }

        // Kiểm tra OTP
        if (!passwordEncoder.matches(otp, token.getOtpHash())) {

            token.setAttempts(token.getAttempts() + 1);
            tokenRepository.save(token);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP không chính xác"
            );
        }

        // Sinh reset token ngẫu nhiên
        byte[] randomBytes = new byte[32];
        RANDOM.nextBytes(randomBytes);

        String resetToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        token.setVerified(true);
        token.setResetTokenHash(sha256(resetToken));
        token.setExpiresAt(
                LocalDateTime.now().plusMinutes(tokenExpirationMinutes)
        );

        tokenRepository.save(token);

        return resetToken;
    }

    // 3. Đặt lại mật khẩu
    @Override
    @Transactional
    public void resetPassword(
            String resetToken,
            String newPassword,
            String confirmPassword
    ) {

        if (!newPassword.equals(confirmPassword)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu xác nhận không khớp"
            );
        }

        String tokenHash = sha256(resetToken);

        PasswordResetToken token = tokenRepository
                .findByResetTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Reset token không hợp lệ"
                ));

        if (!Boolean.TRUE.equals(token.getVerified())
                || token.getExpiresAt().isBefore(LocalDateTime.now())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reset token đã hết hạn hoặc không hợp lệ"
            );
        }

        User user = token.getUser();

        // Mã hóa mật khẩu mới bằng BCrypt
        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        // Token chỉ được sử dụng một lần
        tokenRepository.delete(token);

        log.info("Password reset successfully for user ID: {}",
                user.getId());
    }

    // SHA-256 dùng để lưu hash của reset token
    private String sha256(String value) {

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getEncoder().encodeToString(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "SHA-256 algorithm unavailable", e
            );
        }
    }
}
