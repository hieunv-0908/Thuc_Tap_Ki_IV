package com.funnyshop.repository;

import com.funnyshop.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<EmailVerificationToken> findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);
    Optional<EmailVerificationToken> findTopByEmailAndVerifiedTrueOrderByCreatedAtDesc(String email);

    @Modifying
    @Transactional
    void deleteAllByEmail(String email);
}
