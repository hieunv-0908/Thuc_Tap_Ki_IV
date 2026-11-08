package com.funnyshop.service;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.*;
import com.funnyshop.repository.PasswordResetTokenRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.impl.PasswordResetServiceImpl;
import com.funnyshop.service.impl.UserServiceImpl;
import jakarta.persistence.Table;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FeaturesVerificationTest {

    // =========================================================================
    // 1. MOCK CHO PASSWORD RESET SERVICE
    // =========================================================================
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    // =========================================================================
    // 2. MOCK CHO USER MANAGEMENT SERVICE
    // =========================================================================
    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("$2a$10$oldHashedPassword")
                .fullName("Nguyễn Văn Test")
                .phone("0987654321")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build();

        // Inject configuration properties cho PasswordResetServiceImpl
        ReflectionTestUtils.setField(passwordResetService, "senderEmail", "funnyshops367@gmail.com");
        ReflectionTestUtils.setField(passwordResetService, "otpExpirationMinutes", 5L);
        ReflectionTestUtils.setField(passwordResetService, "tokenExpirationMinutes", 10L);
        ReflectionTestUtils.setField(passwordResetService, "maxAttempts", 5);
        ReflectionTestUtils.setField(passwordResetService, "resendCooldownSeconds", 60L);
    }

    // =========================================================================
    // KIỂM THỬ CHỨC NĂNG 1: ĐỔI MẬT KHẨU BẰNG XÁC THỰC EMAIL (GMAIL OTP)
    // =========================================================================

    @Test
    @DisplayName("1.1 Quên mật khẩu: Gửi OTP thành công qua JavaMailSender")
    void testForgotPassword_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findTopByUser_EmailOrderByCreatedAtDesc("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any(String.class))).thenReturn("$2a$10$encodedOtpHash");

        passwordResetService.forgotPassword("test@example.com");

        // Xác nhận đã xóa token cũ
        verify(tokenRepository, times(1)).deleteAllByUser_Id(1L);

        // Xác nhận đã lưu OTP token mới vào Database
        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository, times(1)).save(tokenCaptor.capture());
        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertEquals(testUser, savedToken.getUser());
        assertEquals("$2a$10$encodedOtpHash", savedToken.getOtpHash());
        assertFalse(savedToken.getVerified());
        assertEquals(0, savedToken.getAttempts());

        // Xác nhận JavaMailSender đã gửi email thành công
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());
        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertEquals("test@example.com", sentMessage.getTo()[0]);
        assertTrue(sentMessage.getSubject().contains("FunnyShop"));
    }

    @Test
    @DisplayName("1.2 Xác thực OTP: Đúng OTP -> Trả về resetToken 32 bytes")
    void testVerifyOtp_Success() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(100L)
                .user(testUser)
                .otpHash("$2a$10$encodedOtpHash")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .attempts(0)
                .build();

        when(tokenRepository.findTopByUser_EmailAndVerifiedFalseOrderByCreatedAtDesc("test@example.com"))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.matches("123456", "$2a$10$encodedOtpHash")).thenReturn(true);

        String resetToken = passwordResetService.verifyOtp("test@example.com", "123456");

        assertNotNull(resetToken);
        assertFalse(resetToken.isEmpty());
        assertTrue(token.getVerified());
        assertNotNull(token.getResetTokenHash());
        verify(tokenRepository, times(1)).save(token);
    }

    @Test
    @DisplayName("1.3 Xác thực OTP: Sai OTP -> Tăng attempts và báo lỗi 400")
    void testVerifyOtp_WrongOtp_IncrementsAttempts() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(100L)
                .user(testUser)
                .otpHash("$2a$10$encodedOtpHash")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .attempts(1)
                .build();

        when(tokenRepository.findTopByUser_EmailAndVerifiedFalseOrderByCreatedAtDesc("test@example.com"))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.matches("999999", "$2a$10$encodedOtpHash")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            passwordResetService.verifyOtp("test@example.com", "999999");
        });

        assertEquals(400, ex.getStatusCode().value());
        assertEquals("OTP không chính xác", ex.getReason());
        assertEquals(2, token.getAttempts());
        verify(tokenRepository, times(1)).save(token);
    }

    @Test
    @DisplayName("1.4 Đặt lại mật khẩu: Token hợp lệ -> Hash mật khẩu mới và xóa token single-use")
    void testResetPassword_Success() {
        // Sinh hash SHA-256 mẫu
        PasswordResetToken token = PasswordResetToken.builder()
                .id(100L)
                .user(testUser)
                .verified(true)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        when(tokenRepository.findByResetTokenHash(any(String.class))).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewSecretPassword@123")).thenReturn("$2a$10$newHashedPassword");

        passwordResetService.resetPassword("dummy-reset-token", "NewSecretPassword@123", "NewSecretPassword@123");

        // Xác nhận mật khẩu mới được lưu bằng BCrypt
        assertEquals("$2a$10$newHashedPassword", testUser.getPassword());
        verify(userRepository, times(1)).save(testUser);

        // Xác nhận token đã bị xóa vĩnh viễn (single-use)
        verify(tokenRepository, times(1)).delete(token);
    }

    // =========================================================================
    // KIỂM THỬ CHỨC NĂNG 2: QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT API - ADMIN)
    // =========================================================================

    @Test
    @DisplayName("2.1 Admin: Lấy danh sách người dùng có phân trang và tìm kiếm keyword")
    void testAdmin_GetAllUsers_WithKeyword() {
        Pageable pageable = PageRequest.of(0, 10);
        List<User> list = Arrays.asList(testUser);
        Page<User> page = new PageImpl<>(list, pageable, 1);

        when(userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                "Nguyen", "Nguyen", "Nguyen", pageable
        )).thenReturn(page);

        Page<UserResponse> result = userService.getAllUsers("Nguyen", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("testuser", result.getContent().get(0).getUsername());
        assertEquals("test@example.com", result.getContent().get(0).getEmail());
    }

    @Test
    @DisplayName("2.2 Admin: Cập nhật trạng thái người dùng (Khóa/Mở khóa)")
    void testAdmin_UpdateUserStatus() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.updateUserStatus(1L, User.Status.BANNED);

        assertNotNull(response);
        assertEquals("BANNED", response.getStatus());
        assertEquals(User.Status.BANNED, testUser.getStatus());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("2.3 Admin: Xóa mềm người dùng (Soft Delete -> Status chuyển thành INACTIVE)")
    void testAdmin_SoftDeleteUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deleteUser(1L);

        assertEquals(User.Status.INACTIVE, testUser.getStatus());
        verify(userRepository, times(1)).save(testUser);
    }

    // =========================================================================
    // KIỂM THỬ CHỨC NĂNG 3: ĐÁNH INDEX CHO ERD (DATABASE INDEXING)
    // =========================================================================

    @Test
    @DisplayName("3.1 ERD Index: Kiểm tra toàn bộ Entity JPA đều có @Table(indexes = ...)")
    void testERD_EntityIndexing_AnnotationsPresent() {
        List<Class<?>> entityClasses = Arrays.asList(
                User.class,
                Product.class,
                Order.class,
                Category.class,
                OrderItem.class,
                PasswordResetToken.class
        );

        for (Class<?> clazz : entityClasses) {
            Table tableAnno = clazz.getAnnotation(Table.class);
            assertNotNull(tableAnno, "Entity " + clazz.getSimpleName() + " phải có annotation @Table");
            assertTrue(tableAnno.indexes().length > 0, "Entity " + clazz.getSimpleName() + " phải có ít nhất 1 Index");

            System.out.println("✅ " + clazz.getSimpleName() + " có " + tableAnno.indexes().length + " indexes:");
            for (jakarta.persistence.Index idx : tableAnno.indexes()) {
                assertFalse(idx.name().isEmpty(), "Index name không được rỗng");
                assertFalse(idx.columnList().isEmpty(), "Index columnList không được rỗng");
                System.out.println("   - [" + idx.name() + "] trên cột (" + idx.columnList() + ")");
            }
        }
    }
}

