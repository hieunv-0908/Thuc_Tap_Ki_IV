package com.funnyshop.repository;

import com.funnyshop.entity.ReviewHelpfulVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewHelpfulVoteRepository extends JpaRepository<ReviewHelpfulVote, Long> {

    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);

    Optional<ReviewHelpfulVote> findByReviewIdAndUserId(Long reviewId, Long userId);

    long countByReviewId(Long reviewId);

    void deleteByReviewId(Long reviewId);

    @Query("SELECT v.review.id FROM ReviewHelpfulVote v WHERE v.user.id = :userId AND v.review.id IN :reviewIds")
    List<Long> findVotedReviewIdsByUserIdAndReviewIds(@Param("userId") Long userId, @Param("reviewIds") List<Long> reviewIds);
}

