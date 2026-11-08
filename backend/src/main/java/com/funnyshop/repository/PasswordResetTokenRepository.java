package com.funnyshop.repository;

import com.funnyshop.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken>
    findTopByUser_EmailOrderByCreatedAtDesc(String email);

    Optional<PasswordResetToken>
    findTopByUser_EmailAndVerifiedFalseOrderByCreatedAtDesc(
            String email
    );

    Optional<PasswordResetToken>
    findByResetTokenHash(String resetTokenHash);

    void deleteAllByUser_Id(Long userId);
}
