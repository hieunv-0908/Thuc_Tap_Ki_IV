package com.funnyshop.repository;

import com.funnyshop.entity.Feedback;
import com.funnyshop.enums.FeedbackStatus;
import com.funnyshop.enums.FeedbackType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Page<Feedback> findByUserId(Long userId, Pageable pageable);

    Page<Feedback> findByUserIdAndStatus(Long userId, FeedbackStatus status, Pageable pageable);

    @Query("SELECT f FROM Feedback f WHERE " +
            "(:status IS NULL OR f.status = :status) AND " +
            "(:type IS NULL OR f.type = :type) AND " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(f.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(f.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(f.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(f.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Feedback> findAllWithFilter(
            @Param("status") FeedbackStatus status,
            @Param("type") FeedbackType type,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    long countByStatus(FeedbackStatus status);
}

