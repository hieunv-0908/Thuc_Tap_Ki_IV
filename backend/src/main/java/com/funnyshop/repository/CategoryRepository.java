package com.funnyshop.repository;

import com.funnyshop.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByIsDeletedFalse();
    Optional<Category> findByIdAndIsDeletedFalse(Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM categories WHERE id = :id", nativeQuery = true)
    int hardDeleteById(@Param("id") Long id);
}
