package com.funnyshop.repository;

import com.funnyshop.entity.Voucher;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Voucher v WHERE LOWER(v.code) = LOWER(:code)")
    Optional<Voucher> findByCodeWithLock(@Param("code") String code);

    @Query("SELECT v FROM Voucher v WHERE v.isActive = true " +
           "AND v.startDate <= :now AND v.endDate >= :now " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "ORDER BY v.createdAt DESC")
    List<Voucher> findAvailableVouchers(@Param("now") LocalDateTime now);

    @Query("SELECT v FROM Voucher v WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(v.code) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(v.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:isActive IS NULL OR v.isActive = :isActive)")
    Page<Voucher> findAllWithFilters(
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}

