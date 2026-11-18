SET NAMES utf8mb4;
USE funnyshop;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_images;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 1. CATEGORIES (4 Danh mục chính)
-- ==========================================================
INSERT INTO categories (id, name, description, is_deleted, created_at, updated_at) VALUES
(1, 'Áo Thời Trang', 'Áo sơ mi, áo thun, áo hoodie nam nữ phong cách hiện đại', 0, NOW(), NOW()),
(2, 'Quần Dài & Jeans', 'Quần jeans, quần tây công sở, quần jogger và quần short thể thao', 0, NOW(), NOW()),
(3, 'Giày Dép & Sneaker', 'Giày sneaker, giày chạy bộ và giày tây nam nữ', 0, NOW(), NOW()),
(4, 'Túi Xách & Đồng Hồ', 'Đồng hồ đeo tay, balo và túi xách thời trang chính hãng', 0, NOW(), NOW());

-- ==========================================================
-- 2. PRODUCTS (24 Sản phẩm thật lọc từ styles.csv)
-- ==========================================================
INSERT INTO products (id, name, description, brand, material, gender_type, category_id, is_deleted, created_at, updated_at) VALUES
(1, 'Áo Sơ Mi Nam Kẻ Caro Xanh Navy', 'Áo Sơ Mi Nam Kẻ Caro Xanh Navy chính hãng Turtle, thiết kế phong cách casual, chất liệu cotton oxford 100% bền đẹp và dễ phối đồ.', 'Turtle', 'Cotton Oxford 100%', 'MEN', 1, 0, DATE_SUB(NOW(), INTERVAL 24 DAY), NOW()),
(2, 'Áo Thun Nam Puma Cổ Tròn Xám Tiêu', 'Áo Thun Nam Puma Cổ Tròn Xám Tiêu chính hãng Puma, thiết kế phong cách casual, chất liệu cotton compact 100% bền đẹp và dễ phối đồ.', 'Puma', 'Cotton Compact 100%', 'MEN', 1, 0, DATE_SUB(NOW(), INTERVAL 23 DAY), NOW()),
(3, 'Áo Sơ Mi Nữ Công Sở Tím Pastel', 'Áo Sơ Mi Nữ Công Sở Tím Pastel chính hãng Jealous 21, thiết kế phong cách casual, chất liệu vải kate lụa mềm bền đẹp và dễ phối đồ.', 'Jealous 21', 'Vải Kate Lụa Mềm', 'WOMEN', 1, 0, DATE_SUB(NOW(), INTERVAL 22 DAY), NOW()),
(4, 'Áo Sơ Mi Nam Dài Tay Kẻ Tím Thanh Lịch', 'Áo Sơ Mi Nam Dài Tay Kẻ Tím Thanh Lịch chính hãng Reid & Taylor, thiết kế phong cách formal, chất liệu cotton poplin chống nhăn bền đẹp và dễ phối đồ.', 'Reid & Taylor', 'Cotton Poplin Chống Nhăn', 'MEN', 1, 0, DATE_SUB(NOW(), INTERVAL 21 DAY), NOW()),
(5, 'Áo Hoodie Thể Thao Nam Adidas Xám', 'Áo Hoodie Thể Thao Nam Adidas Xám chính hãng ADIDAS, thiết kế phong cách sports, chất liệu nỉ da cá cotton 350gsm bền đẹp và dễ phối đồ.', 'ADIDAS', 'Nỉ Da Cá Cotton 350gsm', 'MEN', 1, 0, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
(6, 'Áo Thun Thể Thao Nam Fila Xanh Navy', 'Áo Thun Thể Thao Nam Fila Xanh Navy chính hãng Fila, thiết kế phong cách sports, chất liệu polyester thấm hút mồ hôi bền đẹp và dễ phối đồ.', 'Fila', 'Polyester Thấm Hút Mồ Hôi', 'MEN', 1, 0, DATE_SUB(NOW(), INTERVAL 19 DAY), NOW()),
(7, 'Quần Jeans Nam Peter England Xanh Classic', 'Quần Jeans Nam Peter England Xanh Classic chính hãng Peter England, thiết kế phong cách casual, chất liệu denim cotton 13oz bền đẹp và dễ phối đồ.', 'Peter England', 'Denim Cotton 13oz', 'MEN', 2, 0, DATE_SUB(NOW(), INTERVAL 18 DAY), NOW()),
(8, 'Quần Jogger Thể Thao Nam Đen Phối Sọc', 'Quần Jogger Thể Thao Nam Đen Phối Sọc chính hãng Manchester United, thiết kế phong cách casual, chất liệu nỉ cotton co giãn bền đẹp và dễ phối đồ.', 'Manchester United', 'Nỉ Cotton Co Giãn', 'MEN', 2, 0, DATE_SUB(NOW(), INTERVAL 17 DAY), NOW()),
(9, 'Quần Short Thể Thao Nam Puma Đen', 'Quần Short Thể Thao Nam Puma Đen chính hãng Puma, thiết kế phong cách sports, chất liệu vải dù microfiber nhẹ bền đẹp và dễ phối đồ.', 'Puma', 'Vải Dù Microfiber Nhẹ', 'MEN', 2, 0, DATE_SUB(NOW(), INTERVAL 16 DAY), NOW()),
(10, 'Quần Jeans Nữ Skinny Fit Đen Tuyền', 'Quần Jeans Nữ Skinny Fit Đen Tuyền chính hãng Jealous 21, thiết kế phong cách casual, chất liệu denim co giãn 4 chiều bền đẹp và dễ phối đồ.', 'Jealous 21', 'Denim Co Giãn 4 Chiều', 'WOMEN', 2, 0, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW()),
(11, 'Quần Tây Nam Công Sở John Miller Đen', 'Quần Tây Nam Công Sở John Miller Đen chính hãng John Miller, thiết kế phong cách formal, chất liệu vải tuyết mưa cao cấp bền đẹp và dễ phối đồ.', 'John Miller', 'Vải Tuyết Mưa Cao Cấp', 'MEN', 2, 0, DATE_SUB(NOW(), INTERVAL 14 DAY), NOW()),
(12, 'Quần Thể Thao Nam Adidas Xanh Navy', 'Quần Thể Thao Nam Adidas Xanh Navy chính hãng ADIDAS, thiết kế phong cách sports, chất liệu polyester dệt kim thoáng khí bền đẹp và dễ phối đồ.', 'ADIDAS', 'Polyester Dệt Kim Thoáng Khí', 'MEN', 2, 0, DATE_SUB(NOW(), INTERVAL 13 DAY), NOW()),
(13, 'Giày Sneaker Nam Puma Future Cat Đen', 'Giày Sneaker Nam Puma Future Cat Đen chính hãng Puma, thiết kế phong cách casual, chất liệu da tổng hợp & đế cao su bền đẹp và dễ phối đồ.', 'Puma', 'Da Tổng Hợp & Đế Cao Su', 'MEN', 3, 0, DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
(14, 'Giày Tây Nam Da Bò Buckaroo Đen', 'Giày Tây Nam Da Bò Buckaroo Đen chính hãng Buckaroo, thiết kế phong cách formal, chất liệu da bò thật 100% bền đẹp và dễ phối đồ.', 'Buckaroo', 'Da Bò Thật 100%', 'MEN', 3, 0, DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
(15, 'Giày Sneaker Nam Gas Europa Trắng', 'Giày Sneaker Nam Gas Europa Trắng chính hãng Gas, thiết kế phong cách casual, chất liệu da microfiber & đế eva bền đẹp và dễ phối đồ.', 'Gas', 'Da Microfiber & Đế EVA', 'MEN', 3, 0, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
(16, 'Giày Búp Bê Nữ Carlton London Đen Phối Vàng', 'Giày Búp Bê Nữ Carlton London Đen Phối Vàng chính hãng Carlton London, thiết kế phong cách casual, chất liệu da mềm lót đệm êm bền đẹp và dễ phối đồ.', 'Carlton London', 'Da Mềm Lót Đệm Êm', 'WOMEN', 3, 0, DATE_SUB(NOW(), INTERVAL 9 DAY), NOW()),
(17, 'Giày Chạy Bộ Nam Nike Incinerate Trắng Xanh', 'Giày Chạy Bộ Nam Nike Incinerate Trắng Xanh chính hãng Nike, thiết kế phong cách sports, chất liệu lưới mesh & đệm phylon bền đẹp và dễ phối đồ.', 'Nike', 'Lưới Mesh & Đệm Phylon', 'MEN', 3, 0, DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
(18, 'Giày Lười Vans Classic Slip-On Tím Đen', 'Giày Lười Vans Classic Slip-On Tím Đen chính hãng Vans, thiết kế phong cách casual, chất liệu vải canvas & đế waffle bền đẹp và dễ phối đồ.', 'Vans', 'Vải Canvas & Đế Waffle', 'MEN', 3, 0, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
(19, 'Đồng Hồ Nữ Titan Dây Kim Loại Bạc', 'Đồng Hồ Nữ Titan Dây Kim Loại Bạc chính hãng Titan, thiết kế phong cách casual, chất liệu thép không gỉ 316l bền đẹp và dễ phối đồ.', 'Titan', 'Thép Không Gỉ 316L', 'WOMEN', 4, 0, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
(20, 'Đồng Hồ Thể Thao Nam Casio G-Shock Đen', 'Đồng Hồ Thể Thao Nam Casio G-Shock Đen chính hãng CASIO, thiết kế phong cách casual, chất liệu nhựa resin chống va đập bền đẹp và dễ phối đồ.', 'CASIO', 'Nhựa Resin Chống Va Đập', 'MEN', 4, 0, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(21, 'Đồng Hồ Nữ Fossil Chronograph Vàng Đồng', 'Đồng Hồ Nữ Fossil Chronograph Vàng Đồng chính hãng Fossil, thiết kế phong cách casual, chất liệu thép mạ pvd & kính khoáng bền đẹp và dễ phối đồ.', 'Fossil', 'Thép Mạ PVD & Kính Khoáng', 'WOMEN', 4, 0, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
(22, 'Túi Xách Tay Nữ Murcia Xanh Dương', 'Túi Xách Tay Nữ Murcia Xanh Dương chính hãng Murcia, thiết kế phong cách casual, chất liệu da pu cao cấp chống xước bền đẹp và dễ phối đồ.', 'Murcia', 'Da PU Cao Cấp Chống Xước', 'WOMEN', 4, 0, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
(23, 'Túi Đựng Laptop Unisex Peter England Cam', 'Túi Đựng Laptop Unisex Peter England Cam chính hãng Peter England, thiết kế phong cách casual, chất liệu vải oxford chống thấm bền đẹp và dễ phối đồ.', 'Peter England', 'Vải Oxford Chống Thấm', 'UNISEX', 4, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(24, 'Balo Thể Thao Unisex Nike Swoosh Đen', 'Balo Thể Thao Unisex Nike Swoosh Đen chính hãng Nike, thiết kế phong cách sports, chất liệu polyester 600d bền bỉ bền đẹp và dễ phối đồ.', 'Nike', 'Polyester 600D Bền Bỉ', 'UNISEX', 4, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- ==========================================================
-- 3. PRODUCT VARIANTS (60 Biến thể kích cỡ & tồn kho)
-- ==========================================================
INSERT INTO product_variants (id, product_id, sku, color, size, price, stock_quantity, is_deleted, created_at, updated_at) VALUES
(1, 1, 'FS-15970-S', 'Xanh Navy', 'S', 349000.00, 26, 0, NOW(), NOW()),
(2, 1, 'FS-15970-M', 'Xanh Navy', 'M', 349000.00, 26, 0, NOW(), NOW()),
(3, 1, 'FS-15970-L', 'Xanh Navy', 'L', 349000.00, 26, 0, NOW(), NOW()),
(4, 2, 'FS-53759-S', 'Xám', 'S', 289000.00, 27, 0, NOW(), NOW()),
(5, 2, 'FS-53759-M', 'Xám', 'M', 289000.00, 27, 0, NOW(), NOW()),
(6, 2, 'FS-53759-L', 'Xám', 'L', 289000.00, 27, 0, NOW(), NOW()),
(7, 3, 'FS-26960-S', 'Tím', 'S', 329000.00, 28, 0, NOW(), NOW()),
(8, 3, 'FS-26960-M', 'Tím', 'M', 329000.00, 28, 0, NOW(), NOW()),
(9, 3, 'FS-26960-L', 'Tím', 'L', 329000.00, 28, 0, NOW(), NOW()),
(10, 4, 'FS-12369-S', 'Tím', 'S', 419000.00, 29, 0, NOW(), NOW()),
(11, 4, 'FS-12369-M', 'Tím', 'M', 419000.00, 29, 0, NOW(), NOW()),
(12, 4, 'FS-12369-L', 'Tím', 'L', 419000.00, 29, 0, NOW(), NOW()),
(13, 5, 'FS-13089-S', 'Xám', 'S', 590000.00, 30, 0, NOW(), NOW()),
(14, 5, 'FS-13089-M', 'Xám', 'M', 590000.00, 30, 0, NOW(), NOW()),
(15, 5, 'FS-13089-L', 'Xám', 'L', 590000.00, 30, 0, NOW(), NOW()),
(16, 6, 'FS-7990-S', 'Xanh Navy', 'S', 279000.00, 31, 0, NOW(), NOW()),
(17, 6, 'FS-7990-M', 'Xanh Navy', 'M', 279000.00, 31, 0, NOW(), NOW()),
(18, 6, 'FS-7990-L', 'Xanh Navy', 'L', 279000.00, 31, 0, NOW(), NOW()),
(19, 7, 'FS-39386-S', 'Xanh Dương', 'S', 540000.00, 32, 0, NOW(), NOW()),
(20, 7, 'FS-39386-M', 'Xanh Dương', 'M', 540000.00, 32, 0, NOW(), NOW()),
(21, 7, 'FS-39386-L', 'Xanh Dương', 'L', 540000.00, 32, 0, NOW(), NOW()),
(22, 8, 'FS-21379-S', 'Đen', 'S', 450000.00, 33, 0, NOW(), NOW()),
(23, 8, 'FS-21379-M', 'Đen', 'M', 450000.00, 33, 0, NOW(), NOW()),
(24, 8, 'FS-21379-L', 'Đen', 'L', 450000.00, 33, 0, NOW(), NOW()),
(25, 9, 'FS-18005-S', 'Đen', 'S', 310000.00, 34, 0, NOW(), NOW()),
(26, 9, 'FS-18005-M', 'Đen', 'M', 310000.00, 34, 0, NOW(), NOW()),
(27, 9, 'FS-18005-L', 'Đen', 'L', 310000.00, 34, 0, NOW(), NOW()),
(28, 10, 'FS-26994-S', 'Đen', 'S', 490000.00, 35, 0, NOW(), NOW()),
(29, 10, 'FS-26994-M', 'Đen', 'M', 490000.00, 35, 0, NOW(), NOW()),
(30, 10, 'FS-26994-L', 'Đen', 'L', 490000.00, 35, 0, NOW(), NOW()),
(31, 11, 'FS-10257-S', 'Đen', 'S', 520000.00, 36, 0, NOW(), NOW()),
(32, 11, 'FS-10257-M', 'Đen', 'M', 520000.00, 36, 0, NOW(), NOW()),
(33, 11, 'FS-10257-L', 'Đen', 'L', 520000.00, 36, 0, NOW(), NOW()),
(34, 12, 'FS-17624-S', 'Xanh Navy', 'S', 480000.00, 37, 0, NOW(), NOW()),
(35, 12, 'FS-17624-M', 'Xanh Navy', 'M', 480000.00, 37, 0, NOW(), NOW()),
(36, 12, 'FS-17624-L', 'Xanh Navy', 'L', 480000.00, 37, 0, NOW(), NOW()),
(37, 13, 'FS-9204-39', 'Đen', '39', 1150000.00, 38, 0, NOW(), NOW()),
(38, 13, 'FS-9204-40', 'Đen', '40', 1150000.00, 38, 0, NOW(), NOW()),
(39, 13, 'FS-9204-41', 'Đen', '41', 1150000.00, 38, 0, NOW(), NOW()),
(40, 14, 'FS-9036-39', 'Đen', '39', 1390000.00, 39, 0, NOW(), NOW()),
(41, 14, 'FS-9036-40', 'Đen', '40', 1390000.00, 39, 0, NOW(), NOW()),
(42, 14, 'FS-9036-41', 'Đen', '41', 1390000.00, 39, 0, NOW(), NOW()),
(43, 15, 'FS-39988-39', 'Trắng', '39', 980000.00, 25, 0, NOW(), NOW()),
(44, 15, 'FS-39988-40', 'Trắng', '40', 980000.00, 25, 0, NOW(), NOW()),
(45, 15, 'FS-39988-41', 'Trắng', '41', 980000.00, 25, 0, NOW(), NOW()),
(46, 16, 'FS-59051-39', 'Đen', '39', 690000.00, 26, 0, NOW(), NOW()),
(47, 16, 'FS-59051-40', 'Đen', '40', 690000.00, 26, 0, NOW(), NOW()),
(48, 16, 'FS-59051-41', 'Đen', '41', 690000.00, 26, 0, NOW(), NOW()),
(49, 17, 'FS-3168-39', 'Trắng', '39', 1450000.00, 27, 0, NOW(), NOW()),
(50, 17, 'FS-3168-40', 'Trắng', '40', 1450000.00, 27, 0, NOW(), NOW()),
(51, 17, 'FS-3168-41', 'Trắng', '41', 1450000.00, 27, 0, NOW(), NOW()),
(52, 18, 'FS-29570-39', 'Tím', '39', 1050000.00, 28, 0, NOW(), NOW()),
(53, 18, 'FS-29570-40', 'Tím', '40', 1050000.00, 28, 0, NOW(), NOW()),
(54, 18, 'FS-29570-41', 'Tím', '41', 1050000.00, 28, 0, NOW(), NOW()),
(55, 19, 'FS-59263-F', 'Bạc', 'F', 1650000.00, 29, 0, NOW(), NOW()),
(56, 20, 'FS-17429-F', 'Đen', 'F', 2150000.00, 30, 0, NOW(), NOW()),
(57, 21, 'FS-51658-F', 'Vàng Đồng', 'F', 2490000.00, 31, 0, NOW(), NOW()),
(58, 22, 'FS-47957-F', 'Xanh Dương', 'F', 680000.00, 32, 0, NOW(), NOW()),
(59, 23, 'FS-39524-F', 'Cam', 'F', 450000.00, 33, 0, NOW(), NOW()),
(60, 24, 'FS-12732-F', 'Đen', 'F', 790000.00, 34, 0, NOW(), NOW());

-- ==========================================================
-- 4. PRODUCT IMAGES (24 Ảnh sản phẩm khớp ID file trong thư mục images/)
-- ==========================================================
INSERT INTO product_images (id, product_id, variant_id, image_url, is_primary, created_at) VALUES
(1, 1, NULL, '/images/products/15970.jpg', 1, NOW()),
(2, 2, NULL, '/images/products/53759.jpg', 1, NOW()),
(3, 3, NULL, '/images/products/26960.jpg', 1, NOW()),
(4, 4, NULL, '/images/products/12369.jpg', 1, NOW()),
(5, 5, NULL, '/images/products/13089.jpg', 1, NOW()),
(6, 6, NULL, '/images/products/7990.jpg', 1, NOW()),
(7, 7, NULL, '/images/products/39386.jpg', 1, NOW()),
(8, 8, NULL, '/images/products/21379.jpg', 1, NOW()),
(9, 9, NULL, '/images/products/18005.jpg', 1, NOW()),
(10, 10, NULL, '/images/products/26994.jpg', 1, NOW()),
(11, 11, NULL, '/images/products/10257.jpg', 1, NOW()),
(12, 12, NULL, '/images/products/17624.jpg', 1, NOW()),
(13, 13, NULL, '/images/products/9204.jpg', 1, NOW()),
(14, 14, NULL, '/images/products/9036.jpg', 1, NOW()),
(15, 15, NULL, '/images/products/39988.jpg', 1, NOW()),
(16, 16, NULL, '/images/products/59051.jpg', 1, NOW()),
(17, 17, NULL, '/images/products/3168.jpg', 1, NOW()),
(18, 18, NULL, '/images/products/29570.jpg', 1, NOW()),
(19, 19, NULL, '/images/products/59263.jpg', 1, NOW()),
(20, 20, NULL, '/images/products/17429.jpg', 1, NOW()),
(21, 21, NULL, '/images/products/51658.jpg', 1, NOW()),
(22, 22, NULL, '/images/products/47957.jpg', 1, NOW()),
(23, 23, NULL, '/images/products/39524.jpg', 1, NOW()),
(24, 24, NULL, '/images/products/12732.jpg', 1, NOW());