package com.funnyshop.repository;

import com.funnyshop.entity.FlashSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, Long> {

    List<FlashSaleItem> findByFlashSaleId(Long flashSaleId);

    Optional<FlashSaleItem> findByFlashSaleIdAndProductId(Long flashSaleId, Long productId);

    @Query("SELECT fsi FROM FlashSaleItem fsi " +
           "JOIN FETCH fsi.product p " +
           "WHERE fsi.flashSale.id = :flashSaleId AND p.isDeleted = false")
    List<FlashSaleItem> findByFlashSaleIdWithProduct(@Param("flashSaleId") Long flashSaleId);
}

