package com.funnyshop.repository;

import com.funnyshop.entity.FlashSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {

    @Query("SELECT fs FROM FlashSale fs " +
           "WHERE fs.isActive = true " +
           "AND fs.startTime <= :now AND fs.endTime >= :now " +
           "ORDER BY fs.endTime ASC")
    List<FlashSale> findActiveFlashSales(@Param("now") LocalDateTime now);

    default Optional<FlashSale> findFirstActiveFlashSale(LocalDateTime now) {
        List<FlashSale> activeSales = findActiveFlashSales(now);
        return activeSales.isEmpty() ? Optional.empty() : Optional.of(activeSales.get(0));
    }
}

