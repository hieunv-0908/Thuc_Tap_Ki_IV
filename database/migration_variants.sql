-- =====================================================================
-- MIGRATION SCRIPT: Cập nhật FunnyShop sang mô hình Product Variants
-- An toàn cho Database đang chạy: Tự động migrate dữ liệu cũ sang bảng mới
-- =====================================================================

USE funnyshop;

-- 1. Thêm các cột thời trang vào bảng products nếu chưa có
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NULL AFTER description,
    ADD COLUMN IF NOT EXISTS material VARCHAR(100) NULL AFTER brand,
    ADD COLUMN IF NOT EXISTS gender_type VARCHAR(50) NULL AFTER material;

-- 2. Tạo bảng product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variants_product (product_id),
    INDEX idx_variants_color_size (color, size)
);

-- 3. Tạo bảng product_images
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    variant_id BIGINT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_images_product (product_id),
    INDEX idx_images_variant (variant_id)
);

-- 4. Di chuyển dữ liệu giá & kho cũ từ products sang product_variants (nếu chưa có variant)
INSERT INTO product_variants (product_id, sku, color, size, price, stock_quantity, is_deleted, created_at, updated_at)
SELECT 
    p.id, 
    CONCAT('SKU-', p.id, '-DEF'), 
    'Standard', 
    'F', 
    COALESCE(p.price, 0), 
    COALESCE(p.stock_quantity, 0), 
    COALESCE(p.is_deleted, FALSE),
    NOW(),
    NOW()
FROM products p
WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_variants);

-- 5. Di chuyển ảnh cũ từ products sang product_images
INSERT INTO product_images (product_id, variant_id, image_url, is_primary, created_at)
SELECT 
    p.id, 
    NULL, 
    p.image_url, 
    TRUE, 
    NOW()
FROM products p
WHERE p.image_url IS NOT NULL 
  AND p.image_url <> ''
  AND p.id NOT IN (SELECT DISTINCT product_id FROM product_images WHERE is_primary = TRUE);

-- 6. Cập nhật bảng order_items: Thêm cột product_variant_id và map dữ liệu cũ
ALTER TABLE order_items 
    ADD COLUMN IF NOT EXISTS product_variant_id BIGINT NULL AFTER order_id;

-- Map product_id cũ sang product_variant_id tương ứng
UPDATE order_items oi
JOIN product_variants pv ON oi.product_id = pv.product_id
SET oi.product_variant_id = pv.id
WHERE oi.product_variant_id IS NULL;

-- 7. Thêm ràng buộc khóa ngoại cho order_items
-- (Lưu ý: Nếu khóa ngoại đã tồn tại thì bỏ qua bước này)
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_variant 
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- 8. Cập nhật cart nếu có
ALTER TABLE cart 
    ADD COLUMN IF NOT EXISTS variant_id BIGINT NULL AFTER user_id;

UPDATE cart c
JOIN product_variants pv ON c.product_id = pv.product_id
SET c.variant_id = pv.id
WHERE c.variant_id IS NULL;

