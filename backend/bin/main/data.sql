-- Insert Users
INSERT INTO users (username, email, password, full_name, phone, role, status, created_at, updated_at) VALUES
('admin', 'admin@funnyshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User', '0901234567', 'ADMIN', 'ACTIVE', NOW(), NOW()),
('user1', 'user1@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyen Van A', '0912345678', 'CUSTOMER', 'ACTIVE', NOW(), NOW()),
('user2', 'user2@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Tran Thi B', '0923456789', 'CUSTOMER', 'ACTIVE', NOW(), NOW());

-- Insert Categories
INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Thời trang Nam', 'Sản phẩm thời trang dành cho nam giới: áo sơ mi, quần jeans, áo khoác...', NOW(), NOW()),
('Thời trang Nữ', 'Sản phẩm thời trang dành cho nữ giới: váy, đầm, áo nữ, quần nữ...', NOW(), NOW()),
('Đồ điện tử', 'Các sản phẩm điện tử: điện thoại, laptop, tai nghe, loa...', NOW(), NOW()),
('Phụ kiện & Quà tặng', 'Phụ kiện thời trang, quà tặng, đồ trang sức...', NOW(), NOW()),
('Đồ gia dụng', 'Đồ dùng trong gia đình: bếp, nồi, chảo, máy hút bụi...', NOW(), NOW());

-- Insert Products (40 products)
INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, created_at, updated_at) VALUES
-- Thời trang Nam (10 products)
('Áo Sơ Mi Nam Trắng', 'Áo sơ mi nam trắng cao cấp, vải cotton mềm mại', 250000.00, 50, 1, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', NOW(), NOW()),
('Áo Sơ Mi Nam Xanh', 'Áo sơ mi nam xanh dương, thiết kế slim fit', 280000.00, 45, 1, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400', NOW(), NOW()),
('Quần Jeans Nam', 'Quần jeans nam màu xanh đen, co giãn tốt', 450000.00, 60, 1, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', NOW(), NOW()),
('Áo Khoác Nam', 'Áo khoác nam chống nước, giữ ấm tốt', 850000.00, 30, 1, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', NOW(), NOW()),
('Quần Kaki Nam', 'Quần kaki nam màu be, form dáng đứng', 350000.00, 55, 1, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', NOW(), NOW()),
('Áo Thun Nam', 'Áo thun nam cotton 100%, thoáng mát', 150000.00, 100, 1, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', NOW(), NOW()),
('Áo Polo Nam', 'Áo polo nam cao cấp, cổ bẻ', 320000.00, 40, 1, 'https://images.unsplash.com/photo-1625910513413-5fc45a757d93?w=400', NOW(), NOW()),
('Quần Short Nam', 'Quần short nam vải kaki, thoải mái', 280000.00, 70, 1, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400', NOW(), NOW()),
('Áo Vest Nam', 'Áo vest nam sang trọng, phù hợp đi tiệc', 1500000.00, 15, 1, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400', NOW(), NOW()),
('Giày Sneaker Nam', 'Giày sneaker nam thể thao, đế êm', 650000.00, 45, 1, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', NOW(), NOW()),

-- Thời trang Nữ (10 products)
('Váy Đầm Nữ', 'Váy đầm nữ thiết kế đẹp, chất liệu lụa', 550000.00, 35, 2, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', NOW(), NOW()),
('Áo Sơ Mi Nữ', 'Áo sơ mi nữ công sở, thanh lịch', 320000.00, 50, 2, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', NOW(), NOW()),
('Quần Jeans Nữ', 'Quần jeans nữ skinny, tôn dáng', 480000.00, 55, 2, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400', NOW(), NOW()),
('Áo Khoác Nữ', 'Áo khoác nữ thời trang, giữ ấm', 780000.00, 25, 2, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', NOW(), NOW()),
('Chân Váy Nữ', 'Chân váy nữ ngắn, thời trang', 380000.00, 40, 2, 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=400', NOW(), NOW()),
('Áo Thun Nữ', 'Áo thun nữ cotton, in hình cute', 180000.00, 80, 2, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400', NOW(), NOW()),
('Đầm Maxi', 'Đầm maxi nữ dáng dài, bay bổng', 680000.00, 20, 2, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400', NOW(), NOW()),
('Áo Blouse', 'Áo blouse nữ công sở, sang trọng', 420000.00, 45, 2, 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400', NOW(), NOW()),
('Quần Legging', 'Quần legging nữ co giãn, thoải mái', 250000.00, 90, 2, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400', NOW(), NOW()),
('Giày Cao Gót', 'Giày cao gót nữ 7cm, sang trọng', 890000.00, 30, 2, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', NOW(), NOW()),

-- Đồ điện tử (10 products)
('iPhone 15 Pro', 'Điện thoại iPhone 15 Pro 256GB', 25000000.00, 20, 3, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', NOW(), NOW()),
('Samsung Galaxy S24', 'Điện thoại Samsung Galaxy S24', 22000000.00, 25, 3, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', NOW(), NOW()),
('MacBook Air M2', 'Laptop MacBook Air M2 13 inch', 28000000.00, 15, 3, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', NOW(), NOW()),
('Tai Nghe Bluetooth', 'Tai nghe Bluetooth Sony WH-1000XM5', 5500000.00, 40, 3, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', NOW(), NOW()),
('Loa Bluetooth', 'Loa Bluetooth JBL Charge 5', 3500000.00, 35, 3, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', NOW(), NOW()),
('Đồng hồ thông minh', 'Đồng hồ thông minh Apple Watch Series 9', 9500000.00, 30, 3, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400', NOW(), NOW()),
('Bàn phím cơ', 'Bàn phím cơ Keychron K2', 1800000.00, 50, 3, 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=400', NOW(), NOW()),
('Chuột Gaming', 'Chuột gaming Logitech G502', 1200000.00, 60, 3, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', NOW(), NOW()),
('Màn hình 27 inch', 'Màn hình Dell UltraSharp 27 inch', 8500000.00, 20, 3, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', NOW(), NOW()),
('Webcam HD', 'Webcam Logitech C920 HD', 2200000.00, 45, 3, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400', NOW(), NOW()),

-- Phụ kiện & Quà tặng (5 products)
('Dây chuyền bạc', 'Dây chuyền bạc 925 thiết kế đẹp', 850000.00, 30, 4, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', NOW(), NOW()),
('Nhẫn bạc', 'Nhẫn bạc 925 đơn giản', 450000.00, 50, 4, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400', NOW(), NOW()),
('Balo thời trang', 'Balo thời trang chống nước', 550000.00, 60, 4, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', NOW(), NOW()),
('Ví da nam', 'Ví da nam thật, bền đẹp', 380000.00, 70, 4, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', NOW(), NOW()),
('Túi xách nữ', 'Túi xách nữ da thật, sang trọng', 1200000.00, 25, 4, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', NOW(), NOW()),

-- Đồ gia dụng (5 products)
('Nồi chiên không dầu', 'Nồi chiên không dầu 5L', 1800000.00, 40, 5, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', NOW(), NOW()),
('Máy hút bụi', 'Máy hút bụi cầm tay Xiaomi', 2500000.00, 35, 5, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400', NOW(), NOW()),
('Bếp từ đôi', 'Bếp từ đôi Sunhouse', 3200000.00, 30, 5, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', NOW(), NOW()),
('Nồi lẩu điện', 'Nồi lẩu điện 2L', 850000.00, 55, 5, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', NOW(), NOW()),
('Máy làm nóng nước', 'Máy làm nóng nước tức thì', 1500000.00, 45, 5, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400', NOW(), NOW());
