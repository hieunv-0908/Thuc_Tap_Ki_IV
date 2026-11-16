package com.funnyshop.repository;

import com.funnyshop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE order_items
            SET product_id = NULL, product_variant_id = NULL
            WHERE product_id = :productId
               OR product_variant_id IN (
                   SELECT id FROM product_variants WHERE product_id = :productId
               )
            """, nativeQuery = true)
    int detachProductReferences(@Param("productId") Long productId);
}
