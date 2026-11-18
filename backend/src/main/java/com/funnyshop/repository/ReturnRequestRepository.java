package com.funnyshop.repository;

import com.funnyshop.entity.ReturnRequest;
import com.funnyshop.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    Optional<ReturnRequest> findTopByOrderIdOrderByIdDesc(Long orderId);

    List<ReturnRequest> findByOrderIdOrderByIdDesc(Long orderId);

    Page<ReturnRequest> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT r FROM ReturnRequest r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "CAST(r.order.id AS string) LIKE %:keyword% OR " +
           "LOWER(r.reason) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.order.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.order.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<ReturnRequest> searchReturns(
            @Param("keyword") String keyword,
            @Param("status") ReturnStatus status,
            Pageable pageable);
}

