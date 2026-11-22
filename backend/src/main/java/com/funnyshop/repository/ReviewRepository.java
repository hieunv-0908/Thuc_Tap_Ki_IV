package com.funnyshop.repository;

import com.funnyshop.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    Page<Review> findByProductIdAndRating(Long productId, Integer rating, Pageable pageable);

    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    boolean existsByProductIdAndUserId(Long productId, Long userId);

    long countByProductId(Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.id = :productId GROUP BY r.rating")
    List<Object[]> countGroupByRatingByProductId(@Param("productId") Long productId);

    @Query("""
            SELECT r FROM Review r
            WHERE (:productId IS NULL OR r.product.id = :productId)
              AND (:rating IS NULL OR r.rating = :rating)
              AND (:keyword IS NULL
                   OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.product.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Review> searchReviewsForAdmin(
            @Param("productId") Long productId,
            @Param("rating") Integer rating,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}

