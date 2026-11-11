package com.funnyshop.repository;

import com.funnyshop.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductIdAndIsDeletedFalse(Long productId);

    Optional<ProductVariant> findBySku(String sku);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pv FROM ProductVariant pv WHERE pv.id = :id")
    Optional<ProductVariant> findByIdForUpdate(@Param("id") Long id);

    /**
     * Trừ tồn kho nguyên tử trực tiếp ở tầng CSDL
     * Khóa dòng tức thời, chỉ trừ khi stock_quantity >= qty và is_deleted = false
     *
     * @return số dòng bị ảnh hưởng (1 nếu thành công, 0 nếu không đủ hàng hoặc id sai)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE product_variants " +
                   "SET stock_quantity = stock_quantity - :qty, updated_at = NOW() " +
                   "WHERE id = :variantId " +
                   "  AND is_deleted = false " +
                   "  AND stock_quantity >= :qty",
           nativeQuery = true)
    int decrementStockAtomic(@Param("variantId") Long variantId, @Param("qty") Integer qty);

    /**
     * Hoàn tồn kho nguyên tử khi hủy đơn hàng
     *
     * @return số dòng bị ảnh hưởng
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE product_variants " +
                   "SET stock_quantity = stock_quantity + :qty, updated_at = NOW() " +
                   "WHERE id = :variantId",
           nativeQuery = true)
    int incrementStockAtomic(@Param("variantId") Long variantId, @Param("qty") Integer qty);

    @Modifying
    @Query("UPDATE ProductVariant pv SET pv.isDeleted = :isDeleted WHERE pv.product.id = :productId")
    int updateIsDeletedByProductId(@Param("productId") Long productId, @Param("isDeleted") boolean isDeleted);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);
}

