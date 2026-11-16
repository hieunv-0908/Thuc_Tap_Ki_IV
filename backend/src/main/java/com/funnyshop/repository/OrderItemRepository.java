package com.funnyshop.repository;

import com.funnyshop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.product.id = :productId OR (oi.productVariant IS NOT NULL AND oi.productVariant.product.id = :productId)")
    boolean existsByProductIdOrVariantProductId(@Param("productId") Long productId);
}
