package com.funnyshop.repository;

import com.funnyshop.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = """
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        WHERE (p.isDeleted = false)
          AND (p.category.isDeleted = false)
          AND (:keyword IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL
               OR p.category.id = :categoryId)
        """,
        countQuery = """
        SELECT count(p) FROM Product p
        WHERE (p.isDeleted = false)
          AND (p.category.isDeleted = false)
          AND (:keyword IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL
               OR p.category.id = :categoryId)
        """)
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.id = :id AND p.isDeleted = false AND p.category.isDeleted = false")
    Optional<Product> findByIdWithCategory(@Param("id") Long id);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.id = :id")
    Optional<Product> findByIdWithCategoryAdmin(@Param("id") Long id);

    Optional<Product> findByIdAndIsDeletedFalse(Long id);

    long countByCategoryId(Long categoryId);

    long countByCategoryIdAndIsDeletedFalse(Long categoryId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM products WHERE id = :id", nativeQuery = true)
    int hardDeleteById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.isDeleted = false")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdateIncludingDeleted(@Param("id") Long id);

    @Query(value = """
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        WHERE (:keyword IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL
               OR p.category.id = :categoryId)
        """,
        countQuery = """
        SELECT count(p) FROM Product p
        WHERE (:keyword IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL
               OR p.category.id = :categoryId)
        """)
    Page<Product> searchAllProducts(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.variants pv
        WHERE (:isDeleted IS NULL OR p.isDeleted = :isDeleted)
          AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
        ORDER BY p.id ASC
    """)
    java.util.List<Product> findProductsForExport(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("isDeleted") Boolean isDeleted
    );
}
