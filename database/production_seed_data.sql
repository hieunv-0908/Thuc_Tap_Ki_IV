-- =============================================================================
-- KỊCH BẢN TẠO VÀ KHỞI TẠO DỮ LIỆU MẪU CHUẨN PRODUCTION CHO FUNNYSHOP
-- Hệ quản trị CSDL: MySQL 8.0+ / MariaDB 10.5+
-- Bộ mã ký tự: UTF-8 (utf8mb4_unicode_ci)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TẠO CSDL NẾU CHƯA CÓ
CREATE DATABASE IF NOT EXISTS `funnyshop`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `funnyshop`;

-- =============================================================================
-- 2. TẠO CẤU TRÚC BẢNG (SCHEMA ĐẦY ĐỦ CÙNG CÁC INDEX TỐI ƯU HIỆU NĂNG)
-- =============================================================================

-- 2.1 Bảng users (Tài khoản người dùng & Quản trị)
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100),
    `phone` VARCHAR(20),
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `uk_users_username` (`username`),
    UNIQUE INDEX `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Bảng categories (Danh mục sản phẩm, có soft-delete)
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 Bảng products (Sản phẩm kinh doanh)
CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `price` DECIMAL(12, 2) NOT NULL,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `category_id` BIGINT NULL,
    `image_url` VARCHAR(500),
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_products_name` (`name`),
    INDEX `idx_products_category_deleted` (`category_id`, `is_deleted`),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4 Bảng orders (Đơn đặt hàng)
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `shipping_address` TEXT NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` VARCHAR(20) DEFAULT 'COD',
    `status` ENUM('PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_orders_status_created` (`status`, `created_at`),
    INDEX `idx_orders_user_created` (`user_id`, `created_at`),
    CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5 Bảng order_items (Chi tiết từng món trong đơn hàng)
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `quantity` INT NOT NULL,
    `price_at_order` DECIMAL(12, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_order_items_order_id` (`order_id`),
    INDEX `idx_order_items_product_id` (`product_id`),
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.6 Bảng cart (Giỏ hàng của khách)
CREATE TABLE IF NOT EXISTS `cart` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_product` (`user_id`, `product_id`),
    CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.7 Bảng password_reset_tokens (Xác thực quên mật khẩu qua OTP & Email)
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `reset_token_hash` VARCHAR(64) NULL,
    `expires_at` DATETIME NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `attempts` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_reset_user_created` (`user_id`, `created_at`),
    INDEX `idx_reset_token_hash` (`reset_token_hash`),
    INDEX `idx_password_reset_user_otp` (`user_id`, `otp_hash`),
    INDEX `idx_password_reset_expires` (`expires_at`),
    CONSTRAINT `fk_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. XÓA DỮ LIỆU CŨ TRƯỚC KHI NẠP DỮ LIỆU MẪU MỚI (CHỐNG TRÙNG LẶP ID)
-- =============================================================================
TRUNCATE TABLE `password_reset_tokens`;
TRUNCATE TABLE `cart`;
TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `users`;

-- =============================================================================
-- 4. INSERT DỮ LIỆU MẪU CHÂN THỰC TUYỆT ĐỐI
-- Mật khẩu mặc định cho tất cả tài khoản bên dưới: 123456
-- Chuỗi mã hóa BCrypt tương ứng: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =============================================================================

-- 4.1 USERS
INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@funnyshop.com', '$2y$12$sZhrpjckwFAGogUCxUF8x.z6HZzGRbn.rUa8QlzsRaeQ1V3sVwE/S', 'Nguyễn Hoàng Admin', '0901234567', 'ADMIN', 'ACTIVE', '2026-09-01 08:00:00', '2026-09-01 08:00:00'),
(2, 'admin_kho', 'kho@funnyshop.com', '$2y$12$sZhrpjckwFAGogUCxUF8x.z6HZzGRbn.rUa8QlzsRaeQ1V3sVwE/S', 'Trần Quản Lý Kho', '0902345678', 'ADMIN', 'ACTIVE', '2026-09-05 09:30:00', '2026-09-05 09:30:00'),
(3, 'nguyen_van_an', 'an.nguyen@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn An', '0912345678', 'CUSTOMER', 'ACTIVE', '2026-09-10 10:15:00', '2026-09-10 10:15:00'),
(4, 'tran_thi_bich', 'bich.tran@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị Bích', '0923456789', 'CUSTOMER', 'ACTIVE', '2026-09-15 14:20:00', '2026-09-15 14:20:00'),
(5, 'le_hoang_nam', 'nam.le@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Hoàng Nam', '0934567890', 'CUSTOMER', 'ACTIVE', '2026-09-20 16:45:00', '2026-09-20 16:45:00'),
(6, 'pham_thanh_huong', 'huong.pham@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Phạm Thanh Hương', '0945678901', 'CUSTOMER', 'ACTIVE', '2026-10-01 11:10:00', '2026-10-01 11:10:00'),
(7, 'vu_quoc_viet', 'viet.vu@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Vũ Quốc Việt', '0956789012', 'CUSTOMER', 'BANNED', '2026-10-05 08:30:00', '2026-10-05 08:30:00'),
(8, 'hoang_minh_chau', 'chau.hoang@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hoàng Minh Châu', '0967890123', 'CUSTOMER', 'INACTIVE', '2026-10-10 19:00:00', '2026-10-10 19:00:00');

-- 4.2 CATEGORIES (Danh mục chuẩn E-commerce)
INSERT INTO `categories` (`id`, `name`, `description`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 'Thời trang Nam', 'Trang phục nam cao cấp: áo sơ mi, áo polo, quần tây, jeans và áo khoác lịch lãm.', FALSE, '2026-09-01 08:00:00', '2026-09-01 08:00:00'),
(2, 'Thời trang Nữ', 'Bộ sưu tập thời trang nữ thanh lịch: đầm váy dự tiệc, áo kiểu, chân váy tôn dáng.', FALSE, '2026-09-01 08:00:00', '2026-09-01 08:00:00'),
(3, 'Đồ điện tử & Công nghệ', 'Thiết bị công nghệ chính hãng: điện thoại smartphone, laptop, tai nghe Bluetooth chống ồn.', FALSE, '2026-09-01 08:00:00', '2026-09-01 08:00:00'),
(4, 'Phụ kiện & Quà tặng', 'Phụ kiện thời trang đẳng cấp: ví da bò thật, thắt lưng, đồng hồ đeo tay và quà tặng ý nghĩa.', FALSE, '2026-09-01 08:00:00', '2026-09-01 08:00:00'),
(5, 'Thiết bị Gia dụng & Nhà bếp', 'Đồ gia dụng thông minh tiện ích cho tổ ấm: nồi chiên không dầu, robot hút bụi, máy xay ép.', FALSE, '2026-09-01 08:00:00', '2026-09-01 08:00:00'),
(6, 'Thể thao & Dã ngoại', 'Trang phục & dụng cụ thể thao chuyên nghiệp: giày chạy bộ êm ái, balo dã ngoại, bình giữ nhiệt.', FALSE, '2026-09-01 08:00:00', '2026-09-01 08:00:00');

-- 4.3 PRODUCTS (30 sản phẩm thực tế, ảnh Unsplash chất lượng cao)
INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock_quantity`, `category_id`, `image_url`, `is_deleted`, `created_at`, `updated_at`) VALUES
-- Danh mục 1: Thời trang Nam
(1, 'Áo Sơ Mi Nam Trắng Oxford Cổ Bẻ', 'Chất liệu vải sợi bông tự nhiên 100% Cotton Oxford mềm mịn, chống nhăn, thấm hút mồ hôi tối ưu.', 250000.00, 80, 1, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', FALSE, '2026-09-10 09:00:00', '2026-09-10 09:00:00'),
(2, 'Áo Polo Nam Classic Pique Thoáng Khí', 'Thiết kế dáng regular fit vừa vặn, bo cổ tinh tế, phong cách năng động cho đi làm và dạo phố.', 320000.00, 65, 1, 'https://images.unsplash.com/photo-1625910513413-5fc45a757d93?w=600', FALSE, '2026-09-10 09:10:00', '2026-09-10 09:10:00'),
(3, 'Quần Jeans Nam Slimfit Co Giãn 4 Chiều', 'Chất liệu Denim cotton co giãn cao cấp, wash màu xanh chàm cổ điển, giữ form cực tốt qua nhiều lần giặt.', 450000.00, 50, 1, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', FALSE, '2026-09-10 09:20:00', '2026-09-10 09:20:00'),
(4, 'Áo Khoác Gió Nam 2 Lớp Chống Nước', 'Công nghệ trượt nước chuẩn DWR, cản gió giữ nhiệt, kèm mũ trùm tiện lợi khi đi phượt hoặc thời tiết mưa lạnh.', 590000.00, 35, 1, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', FALSE, '2026-09-10 09:30:00', '2026-09-10 09:30:00'),
(5, 'Quần Tây Nam Dáng Dứng May Đo Chuẩn', 'Vải tuyết mưa dệt kim cao cấp, không bai xù, đường ly sắc sảo giúp tôn lên nét lịch lãm quý ông.', 420000.00, 40, 1, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', FALSE, '2026-09-10 09:40:00', '2026-09-10 09:40:00'),

-- Danh mục 2: Thời trang Nữ
(6, 'Đầm Maxi Voan Hoa Nhí Mùa Hè', 'Chất vải voan tơ mềm mại, họa tiết hoa nhí vintage, tùng váy xòe bồng bềnh thích hợp đi biển và du lịch.', 550000.00, 45, 2, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', FALSE, '2026-09-11 10:00:00', '2026-09-11 10:00:00'),
(7, 'Váy Dự Tiệc Lụa Satin Sang Trọng', 'Thiết kế cổ yếm quyến rũ, chất lụa satin óng ả, đường may chiết eo tinh tế giúp che khuyết điểm.', 650000.00, 30, 2, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', FALSE, '2026-09-11 10:10:00', '2026-09-11 10:10:00'),
(8, 'Áo Sơ Mi Lụa Công Sở Thắt Nơ Cổ', 'Chất lụa hàn mát rượi, tay dài phồng nhẹ, phối nơ cổ tạo phong thái thanh lịch và chuyên nghiệp.', 380000.00, 55, 2, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', FALSE, '2026-09-11 10:20:00', '2026-09-11 10:20:00'),
(9, 'Chân Váy Chữ A Xếp Ly Dáng Dài', 'Vải kaki mềm đứng form, lưng thun co giãn thoải mái, dễ phối đồ cùng áo thun, croptop hoặc áo len.', 320000.00, 60, 2, 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=600', FALSE, '2026-09-11 10:30:00', '2026-09-11 10:30:00'),
(10, 'Quần Jeans Nữ Cạp Cao Tôn Dáng Skinny', 'Form lưng cao ôm sát vòng eo và nâng mông, vải denim co giãn đa chiều tạo cảm giác thoải mái khi di chuyển.', 480000.00, 50, 2, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', FALSE, '2026-09-11 10:40:00', '2026-09-11 10:40:00'),
(11, 'Giày Cao Gót Nữ Mũi Nhọn 7cm Da Bóng', 'Đế lót đệm êm chống trượt, gót thanh mảnh chắc chắn, độ cao lý tưởng giúp nàng tự tin sải bước.', 890000.00, 25, 2, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600', FALSE, '2026-09-11 10:50:00', '2026-09-11 10:50:00'),

-- Danh mục 3: Đồ điện tử & Công nghệ
(12, 'Điện Thoại iPhone 15 Pro 256GB Titan Tự Nhiên', 'Chip Apple A17 Pro mạnh mẽ, khung viền titan siêu nhẹ, cụm 3 camera 48MP đỉnh cao quay phim chuẩn rạp.', 25990000.00, 15, 3, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600', FALSE, '2026-09-12 11:00:00', '2026-09-12 11:00:00'),
(13, 'Samsung Galaxy S24 Ultra 512GB AI Phone', 'Trí tuệ nhân tạo Galaxy AI đột phá, bút S-Pen tích hợp, màn hình Dynamic AMOLED 2X 120Hz chống chói hoàn hảo.', 27490000.00, 12, 3, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', FALSE, '2026-09-12 11:10:00', '2026-09-12 11:10:00'),
(14, 'Tai Nghe Chống Ồn Chủ Động Sony WH-1000XM5', 'Bộ xử lý chống ồn kép V1 & QN1, chất âm Hi-Res sắc nét đỉnh cao, thời lượng pin ấn tượng lên tới 30 giờ.', 5500000.00, 30, 3, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', FALSE, '2026-09-12 11:20:00', '2026-09-12 11:20:00'),
(15, 'Loa Bluetooth Kháng Nước JBL Charge 5', 'Âm trầm JBL Pro Sound đầy nội lực, pin 20 giờ có tính năng sạc dự phòng cho điện thoại, chuẩn chống bụi nước IP67.', 3490000.00, 25, 3, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600', FALSE, '2026-09-12 11:30:00', '2026-09-12 11:30:00'),
(16, 'Đồng Hồ Thông Minh Apple Watch Series 9 GPS 45mm', 'Chip S9 SiP tiên tiến, thao tác chạm đúp Double Tap độc đáo, đo nhịp tim, nồng độ oxy trong máu SpO2.', 9890000.00, 20, 3, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600', FALSE, '2026-09-12 11:40:00', '2026-09-12 11:40:00'),
(17, 'Bàn Phím Cơ Không Dây Keychron K2 Pro QMK/VIA', 'Switch cơ học Gateron mượt mà, kết nối Bluetooth 5.1 cùng lúc 3 thiết bị, hỗ trợ tùy biến phím bấm linh hoạt.', 1850000.00, 40, 3, 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=600', FALSE, '2026-09-12 11:50:00', '2026-09-12 11:50:00'),
(18, 'Chuột Chơi Game Không Dây Logitech G502 X PLUS', 'Cảm biến quang học HERO 25K chuẩn xác từng milimet, switch quang cơ Hybrid Optical-Mechanical siêu bền.', 2290000.00, 35, 3, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600', FALSE, '2026-09-12 12:00:00', '2026-09-12 12:00:00'),

-- Danh mục 4: Phụ kiện & Quà tặng
(19, 'Ví Da Bò Nam Dáng Ngang Khâu Tay Handmade', 'Chất liệu da bò Nappa thật 100%, nhiều ngăn đựng thẻ ATM và tiền mặt, lót bảo vệ chống quét trộm thẻ RFID.', 390000.00, 70, 4, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', FALSE, '2026-09-13 14:00:00', '2026-09-13 14:00:00'),
(20, 'Balo Laptop Chống Sốc Chống Nước Oxford', 'Ngăn chứa laptop 15.6 inch lót nhung chống sốc, cổng sạc USB tích hợp, quai đeo trợ lực thoáng khí êm vai.', 550000.00, 50, 4, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', FALSE, '2026-09-13 14:10:00', '2026-09-13 14:10:00'),
(21, 'Túi Xách Nữ Da Thật Phong Cách Công Sở', 'Form túi đứng thanh lịch, khóa mạ vàng chống gỉ, không gian chứa đồ rộng rãi kèm dây đeo chéo tùy chỉnh.', 1250000.00, 20, 4, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', FALSE, '2026-09-13 14:20:00', '2026-09-13 14:20:00'),
(22, 'Dây Chuyền Nữ Bạc Ý 925 Mặt Đính Đá Cubic', 'Chất liệu bạc Ý 925 sáng bóng không gỉ sét, đính đá Zirconia lấp lánh sang trọng, món quà hoàn hảo cho phái đẹp.', 680000.00, 35, 4, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', FALSE, '2026-09-13 14:30:00', '2026-09-13 14:30:00'),

-- Danh mục 5: Thiết bị Gia dụng & Nhà bếp
(23, 'Nồi Chiên Không Dầu Điện Tử Philips 6.2L', 'Công nghệ Rapid Air giảm 90% lượng mỡ thừa, bảng điều khiển cảm ứng trực quan, 14 chế độ nấu thông minh.', 2450000.00, 30, 5, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600', FALSE, '2026-09-14 15:00:00', '2026-09-14 15:00:00'),
(24, 'Robot Hút Bụi Lau Nhà Tự Động Dreame D9 Max', 'Lực hút mạnh mẽ 4000Pa, định vị Laser LiDAR quét bản đồ 3D thông minh, tự động né vật cản và chống rơi cầu thang.', 4990000.00, 18, 5, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600', FALSE, '2026-09-14 15:10:00', '2026-09-14 15:10:00'),
(25, 'Bếp Điện Từ Đôi Sunhouse Mặt Kính Cường Lực', 'Tổng công suất 4000W gia nhiệt siêu tốc, chế độ hẹn giờ nấu thông minh, khóa an toàn trẻ em an tâm sử dụng.', 3190000.00, 22, 5, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', FALSE, '2026-09-14 15:20:00', '2026-09-14 15:20:00'),
(26, 'Máy Xay Sinh Tố Cầm Tay Tiện Lợi Lock&Lock', 'Lưỡi dao thép không gỉ 304, cối xay kiêm bình nước mang đi 600ml, dễ dàng thưởng thức smoothie bổ dưỡng.', 590000.00, 45, 5, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600', FALSE, '2026-09-14 15:30:00', '2026-09-14 15:30:00'),

-- Danh mục 6: Thể thao & Dã ngoại
(27, 'Giày Chạy Bộ Nam Thể Thao Đệm Khí Êm Chân', 'Đế bọt khí Boost hoàn trả năng lượng tối ưu, thân giày vải dệt Flyknit thoáng khí, chống trơn trượt trên mọi địa hình.', 750000.00, 40, 6, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', FALSE, '2026-09-15 16:00:00', '2026-09-15 16:00:00'),
(28, 'Bình Giữ Nhiệt Inox 316 Cao Cấp 800ml', 'Công nghệ cách nhiệt chân không kép giữ nóng 12h và giữ lạnh 24h, kèm lưới lọc trà inox và quai xách tiện lợi.', 220000.00, 90, 6, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', FALSE, '2026-09-15 16:10:00', '2026-09-15 16:10:00'),
(29, 'Thảm Tập Yoga Định Tuyến Chống Trượt TPE 8mm', 'Chất liệu TPE sinh thái không mùi, bề mặt dập vân định tuyến chuẩn động tác, độ dày 8mm bảo vệ khớp tối ưu.', 350000.00, 60, 6, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', FALSE, '2026-09-15 16:20:00', '2026-09-15 16:20:00'),
(30, 'Đồng Hồ Đo Nhịp Tim Thể Thao Xiaomi Band 8 Pro', 'Màn hình AMOLED lớn 1.74 inch sắc nét, tích hợp định vị độc lập GPS, hơn 150 chế độ tập luyện chuyên nghiệp.', 1390000.00, 35, 6, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', FALSE, '2026-09-15 16:30:00', '2026-09-15 16:30:00');

-- 4.4 ORDERS (Đơn hàng đa dạng trạng thái, địa chỉ thực tế, doanh thu chuẩn xác)
INSERT INTO `orders` (`id`, `user_id`, `customer_name`, `phone`, `shipping_address`, `total_amount`, `payment_method`, `status`, `created_at`, `updated_at`) VALUES
-- Đơn 1: Đã giao thành công
(1, 3, 'Nguyễn Văn An', '0912345678', 'Số 45, Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 950000.00, 'COD', 'COMPLETED', '2026-10-15 09:30:00', '2026-10-18 14:20:00'),

-- Đơn 2: Đã giao thành công
(2, 4, 'Trần Thị Bích', '0923456789', 'Số 120, Phố Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội', 1540000.00, 'VNPAY', 'COMPLETED', '2026-10-22 14:15:00', '2026-10-25 16:45:00'),

-- Đơn 3: Đang trên đường giao hàng (SHIPPING)
(3, 5, 'Lê Hoàng Nam', '0934567890', 'Số 88, Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng', 7350000.00, 'BANKING', 'SHIPPING', '2026-11-05 10:20:00', '2026-11-06 08:30:00'),

-- Đơn 4: Đang đóng gói tại kho (PROCESSING)
(4, 6, 'Phạm Thanh Hương', '0945678901', 'Số 15, Đường Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa', 7440000.00, 'COD', 'PROCESSING', '2026-11-08 15:40:00', '2026-11-08 17:00:00'),

-- Đơn 5: Mới đặt chờ xác nhận (PENDING)
(5, 3, 'Nguyễn Văn An', '0912345678', 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh', 25990000.00, 'VNPAY', 'PENDING', '2026-11-09 09:15:00', '2026-11-09 09:15:00'),

-- Đơn 6: Đơn đã hủy (CANCELLED)
(6, 4, 'Trần Thị Bích', '0923456789', 'Số 68, Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội', 590000.00, 'COD', 'CANCELLED', '2026-10-28 11:00:00', '2026-10-28 11:30:00'),

-- Đơn 7: Đã giao thành công
(7, 5, 'Lê Hoàng Nam', '0934567890', 'Số 204, Đường 30 Tháng 4, Phường Hưng Lợi, Quận Ninh Kiều, Cần Thơ', 940000.00, 'VNPAY', 'COMPLETED', '2026-11-02 16:30:00', '2026-11-04 10:10:00'),

-- Đơn 8: Đã giao thành công
(8, 6, 'Phạm Thanh Hương', '0945678901', 'Số 12, Đường Quang Trung, Phường Vạn Thắng, TP. Nha Trang, Khánh Hòa', 1190000.00, 'COD', 'COMPLETED', '2026-10-30 08:45:00', '2026-11-02 11:20:00');

-- 4.5 ORDER_ITEMS (Chi tiết sản phẩm khớp 100% với giá và tổng tiền đơn hàng)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price_at_order`, `created_at`, `updated_at`) VALUES
-- Cho Đơn 1: 2 Áo sơ mi (250k*2) + 1 Quần Jeans (450k) = 950k
(1, 1, 1, 2, 250000.00, '2026-10-15 09:30:00', '2026-10-15 09:30:00'),
(2, 1, 3, 1, 450000.00, '2026-10-15 09:30:00', '2026-10-15 09:30:00'),

-- Cho Đơn 2: 1 Váy dự tiệc (650k) + 1 Giày cao gót (890k) = 1,540,000
(3, 2, 7, 1, 650000.00, '2026-10-22 14:15:00', '2026-10-22 14:15:00'),
(4, 2, 11, 1, 890000.00, '2026-10-22 14:15:00', '2026-10-22 14:15:00'),

-- Cho Đơn 3: 1 Tai nghe Sony (5,500k) + 1 Bàn phím cơ Keychron (1,850k) = 7,350,000
(5, 3, 14, 1, 5500000.00, '2026-11-05 10:20:00', '2026-11-05 10:20:00'),
(6, 3, 17, 1, 1850000.00, '2026-11-05 10:20:00', '2026-11-05 10:20:00'),

-- Cho Đơn 4: 1 Nồi chiên Philips (2,450k) + 1 Robot hút bụi Dreame (4,990k) = 7,440,000
(7, 4, 23, 1, 2450000.00, '2026-11-08 15:40:00', '2026-11-08 15:40:00'),
(8, 4, 24, 1, 4990000.00, '2026-11-08 15:40:00', '2026-11-08 15:40:00'),

-- Cho Đơn 5: 1 iPhone 15 Pro (25,990k) = 25,990,000
(9, 5, 12, 1, 25990000.00, '2026-11-09 09:15:00', '2026-11-09 09:15:00'),

-- Cho Đơn 6: 1 Áo khoác gió (590k) = 590,000
(10, 6, 4, 1, 590000.00, '2026-10-28 11:00:00', '2026-10-28 11:00:00'),

-- Cho Đơn 7: 1 Ví da bò (390k) + 1 Balo laptop (550k) = 940,000
(11, 7, 19, 1, 390000.00, '2026-11-02 16:30:00', '2026-11-02 16:30:00'),
(12, 7, 20, 1, 550000.00, '2026-11-02 16:30:00', '2026-11-02 16:30:00'),

-- Cho Đơn 8: 1 Giày chạy bộ (750k) + 2 Bình giữ nhiệt (220k*2=440k) = 1,190,000
(13, 8, 27, 1, 750000.00, '2026-10-30 08:45:00', '2026-10-30 08:45:00'),
(14, 8, 28, 2, 220000.00, '2026-10-30 08:45:00', '2026-10-30 08:45:00');

-- 4.6 CART (Giỏ hàng sẵn có cho khách hàng trải nghiệm)
INSERT INTO `cart` (`id`, `user_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
-- Khách Trần Thị Bích (user 4) đang có 2 món trong giỏ hàng
(1, 4, 6, 1, '2026-11-08 20:00:00', '2026-11-08 20:00:00'),
(2, 4, 22, 1, '2026-11-08 20:05:00', '2026-11-08 20:05:00'),

-- Khách Lê Hoàng Nam (user 5) đang có 1 chuột Logitech trong giỏ hàng
(3, 5, 18, 1, '2026-11-09 08:30:00', '2026-11-09 08:30:00');

-- =============================================================================
-- 5. BẬT LẠI RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEY CHECKS)
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- HOÀN TẤT NẠP DỮ LIỆU THÀNH CÔNG!
