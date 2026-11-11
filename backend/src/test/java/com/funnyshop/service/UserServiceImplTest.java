package com.funnyshop.service;

import com.funnyshop.dto.request.UserCreateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void createUserUsesRequestedRoleAndStatusAndEncodesPassword() {
        UserCreateRequest request = UserCreateRequest.builder()
                .username(" new-admin ")
                .email(" admin@example.com ")
                .password("secret123")
                .role(User.Role.ADMIN)
                .status(User.Status.BANNED)
                .build();

        when(userRepository.existsByUsername("new-admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        UserResponse response = userService.createUser(request);

        assertEquals("new-admin", response.getUsername());
        assertEquals("admin@example.com", response.getEmail());
        assertEquals("ADMIN", response.getRole());
        assertEquals("BANNED", response.getStatus());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUserDefaultsToActiveCustomerWhenRoleAndStatusAreOmitted() {
        UserCreateRequest request = UserCreateRequest.builder()
                .username("new-customer")
                .email("customer@example.com")
                .password("secret123")
                .build();

        when(userRepository.existsByUsername("new-customer")).thenReturn(false);
        when(userRepository.existsByEmail("customer@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(2L);
            return user;
        });

        UserResponse response = userService.createUser(request);

        assertEquals("CUSTOMER", response.getRole());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void updateUserRoleUpdatesAndReturnsUser() {
        User user = User.builder()
                .id(10L)
                .username("customer")
                .email("customer@example.com")
                .password("encoded-password")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateUserRole(10L, User.Role.ADMIN);

        assertEquals(User.Role.ADMIN, user.getRole());
        assertEquals("ADMIN", response.getRole());
        verify(userRepository).save(user);
    }

    @Test
    void updateUserRoleThrowsWhenUserDoesNotExist() {
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> userService.updateUserRole(404L, User.Role.ADMIN)
        );
    }
}
