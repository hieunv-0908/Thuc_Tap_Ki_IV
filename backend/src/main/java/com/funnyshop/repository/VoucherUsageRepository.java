package com.funnyshop.repository;

import com.funnyshop.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {

    long countByVoucherIdAndUserId(Long voucherId, Long userId);

    List<VoucherUsage> findByUserId(Long userId);

    List<VoucherUsage> findByOrderId(Long orderId);

    Optional<VoucherUsage> findByOrderIdAndVoucherId(Long orderId, Long voucherId);

    void deleteByOrderId(Long orderId);
}

