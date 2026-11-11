-- =======================================================
-- FUNNYSHOP INITIAL DATA
-- Hỗ trợ phân loại Thời trang: Product Variants & Images
-- =======================================================

USE funnyshop;

-- 1. Insert Users
INSERT INTO users (id, username, email, password, full_name, phone, role, status, created_at, updated_at) VALUES
(1, 'admin', 'admin@funnyshop.com', '$2a$12$5..6Bs/3HRVgcxig52IN3uFBw.AxrFHYzeAjgCG88MLpNz5o0A4yG', 'Admin User', '0901234567', 'ADMIN', 'ACTIVE', NOW(), NOW()),
(2, 'user1', 'user1@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyen Van A', '0912345678', 'CUSTOMER', 'ACTIVE', NOW(), NOW()),
(3, 'user2', 'user2@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Tran Thi B', '0923456789', 'CUSTOMER', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Insert Categories
INSERT INTO categories (id, name, description, is_deleted, created_at, updated_at) VALUES
(1, 'Thời trang Nam', 'Sản phẩm thời trang dành cho nam giới: áo polo, sơ mi, quần jeans, áo khoác...', FALSE, NOW(), NOW()),
(2, 'Thời trang Nữ', 'Sản phẩm thời trang dành cho nữ giới: váy đầm lụa, sơ mi, quần tây, áo khoác...', FALSE, NOW(), NOW()),
(3, 'Đồ điện tử', 'Các sản phẩm công nghệ và phụ kiện cao cấp...', FALSE, NOW(), NOW()),
(4, 'Phụ kiện Thời trang', 'Phụ kiện ví da, thắt lưng, balo, trang sức thời thượng...', FALSE, NOW(), NOW()),
(5, 'Đồ gia dụng', 'Tiện ích không gian sống gia đình...', FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 3. Insert Products (Mô hình thời trang: brand, material, gender_type)
INSERT INTO products (id, name, description, brand, material, gender_type, category_id, is_deleted, created_at, updated_at) VALUES
(1, 'Áo Polo Nam Classic Fit', 'Áo polo nam dáng Regular Classic, co giãn 4 chiều thoáng khí, lịch lãm công sở và dạo phố.', 'FunnyStyle', 'Cotton Pique 100%', 'MEN', 1, FALSE, NOW(), NOW()),
(2, 'Áo Sơ Mi Nam Oxford Dài Tay', 'Áo sơ mi nam chất liệu Oxford dày dặn, đứng form, chống nhăn cao cấp.', 'FunnyStyle', 'Vải Oxford Premium', 'MEN', 1, FALSE, NOW(), NOW()),
(3, 'Quần Jeans Nam Slimfit Co Giãn', 'Quần jeans nam form slimfit hiện đại, vải denim cao cấp bền màu.', 'DenimLab', 'Denim Cotton Spandex', 'MEN', 1, FALSE, NOW(), NOW()),
(4, 'Váy Đầm Nữ Lụa Xòe Dáng Dài', 'Đầm lụa nữ thiết kế chiết eo tôn dáng, chất liệu lụa mềm mại bay bổng.', 'GraceLady', 'Lụa Tơ Tằm Tự Nhiên', 'WOMEN', 2, FALSE, NOW(), NOW()),
(5, 'Áo Khoác Blazer Nữ Công Sở', 'Áo khoác blazer nữ 2 lớp sang trọng, đường may tỉ mỉ thanh lịch.', 'GraceLady', 'Kaki Tuyết Mưa', 'WOMEN', 2, FALSE, NOW(), NOW()),
(6, 'Áo Thun Unisex Basic Minimalist', 'Áo thun form rộng tay lỡ phong cách đường phố trẻ trung năng động.', 'FunnyStreet', 'Cotton 2 Chiều 250gsm', 'UNISEX', 1, FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 4. Insert Product Variants (SKU, Màu sắc, Kích cỡ, Giá bán, Tồn kho)
INSERT INTO product_variants (id, product_id, sku, color, size, price, stock_quantity, is_deleted, created_at, updated_at) VALUES
-- Áo Polo Nam (Product 1): 4 biến thể
(1, 1, 'POLO-BLK-M', 'Black', 'M', 320000.00, 25, FALSE, NOW(), NOW()),
(2, 1, 'POLO-BLK-L', 'Black', 'L', 320000.00, 30, FALSE, NOW(), NOW()),
(3, 1, 'POLO-NVY-M', 'Navy', 'M', 320000.00, 20, FALSE, NOW(), NOW()),
(4, 1, 'POLO-NVY-L', 'Navy', 'L', 320000.00, 15, FALSE, NOW(), NOW()),

-- Áo Sơ Mi Nam Oxford (Product 2): 4 biến thể
(5, 2, 'SOMI-WHT-M', 'White', 'M', 380000.00, 35, FALSE, NOW(), NOW()),
(6, 2, 'SOMI-WHT-L', 'White', 'L', 380000.00, 40, FALSE, NOW(), NOW()),
(7, 2, 'SOMI-BLU-M', 'Light Blue', 'M', 390000.00, 25, FALSE, NOW(), NOW()),
(8, 2, 'SOMI-BLU-L', 'Light Blue', 'L', 390000.00, 20, FALSE, NOW(), NOW()),

-- Quần Jeans Nam (Product 3): 4 biến thể
(9, 3, 'JEAN-BLU-29', 'Dark Blue', '29', 490000.00, 30, FALSE, NOW(), NOW()),
(10, 3, 'JEAN-BLU-30', 'Dark Blue', '30', 490000.00, 35, FALSE, NOW(), NOW()),
(11, 3, 'JEAN-BLK-29', 'Black', '29', 490000.00, 20, FALSE, NOW(), NOW()),
(12, 3, 'JEAN-BLK-30', 'Black', '30', 490000.00, 25, FALSE, NOW(), NOW()),

-- Váy Đầm Nữ Lụa Xòe (Product 4): 3 biến thể
(13, 4, 'DAM-RED-S', 'Ruby Red', 'S', 650000.00, 15, FALSE, NOW(), NOW()),
(14, 4, 'DAM-RED-M', 'Ruby Red', 'M', 650000.00, 20, FALSE, NOW(), NOW()),
(15, 4, 'DAM-BEI-M', 'Beige', 'M', 650000.00, 18, FALSE, NOW(), NOW()),

-- Áo Khoác Blazer Nữ (Product 5): 2 biến thể
(16, 5, 'BLAZER-BEI-S', 'Beige', 'S', 820000.00, 12, FALSE, NOW(), NOW()),
(17, 5, 'BLAZER-BEI-M', 'Beige', 'M', 820000.00, 18, FALSE, NOW(), NOW()),

-- Áo Thun Unisex (Product 6): 3 biến thể
(18, 6, 'TSHIRT-WHT-L', 'White', 'L', 190000.00, 50, FALSE, NOW(), NOW()),
(19, 6, 'TSHIRT-BLK-L', 'Black', 'L', 190000.00, 45, FALSE, NOW(), NOW()),
(20, 6, 'TSHIRT-BLK-XL', 'Black', 'XL', 200000.00, 30, FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 5. Insert Product Images (Gán ảnh theo sản phẩm và biến thể)
INSERT INTO product_images (id, product_id, variant_id, image_url, is_primary, created_at) VALUES
-- Product 1: Polo (Black & Navy)
(1, 1, 1, 'https://images.unsplash.com/photo-1625910513413-5fc45a757d93?w=800', TRUE, NOW()),
(2, 1, 3, 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800', FALSE, NOW()),

-- Product 2: Sơ mi Oxford (White & Light Blue)
(3, 2, 5, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', TRUE, NOW()),
(4, 2, 7, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800', FALSE, NOW()),

-- Product 3: Jeans
(5, 3, 9, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', TRUE, NOW()),
(6, 3, 11, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', FALSE, NOW()),

-- Product 4: Váy Đầm Lụa (Ruby Red & Beige)
(7, 4, 13, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', TRUE, NOW()),
(8, 4, 15, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', FALSE, NOW()),

-- Product 5: Blazer Nữ
(9, 5, 16, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800', TRUE, NOW()),

-- Product 6: Áo Thun Unisex
(10, 6, 18, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', TRUE, NOW()),
(11, 6, 19, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800', FALSE, NOW())
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);
