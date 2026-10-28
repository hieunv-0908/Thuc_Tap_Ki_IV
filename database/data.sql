-- Sample Data for FunnyShop
-- This script inserts initial data for testing purposes
CREATE DATABASE IF NOT EXISTS funnyshop;
USE funnyshop;

-- =============================================
-- 1. Insert sample users
-- =============================================
INSERT INTO users (username, email, password, role) VALUES
    ('admin', 'admin@funnyshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN'),
    ('user1', 'user1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER'),
    ('user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER');

-- =============================================
-- 2. Insert sample categories
-- =============================================
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Clothing', 'Fashion and apparel items'),
    ('Books', 'Books and educational materials'),
    ('Home & Garden', 'Home decor and gardening supplies'),
    ('Sports', 'Sports equipment and accessories'),
    ('Furniture', 'Furniture and home office products'),
    ('Beauty', 'Beauty and personal care products'),
    ('Toys & Games', 'Toys, board games and entertainment');

-- =============================================
-- 3. Insert 30 sample products
-- =============================================
INSERT INTO products
(name, description, price, stock_quantity, category_id, image_url)
VALUES
-- Electronics (category_id = 1)
('Laptop Pro 15', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 50, 1, '/images/laptop.jpg'),
('Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 100, 1, '/images/headphones.jpg'),
('Smart Watch', 'Fitness tracking smart watch with heart rate monitor', 299.99, 75, 1, '/images/smartwatch.jpg'),
('Wireless Mouse', 'Ergonomic wireless mouse with adjustable DPI', 25.99, 100, 1, '/images/wireless-mouse.jpg'),
('Mechanical Keyboard', 'Mechanical keyboard with RGB backlighting', 79.99, 60, 1, '/images/mechanical-keyboard.jpg'),
('USB-C Hub', 'Multiport USB-C hub for laptops', 39.99, 80, 1, '/images/usb-c-hub.jpg'),
('Bluetooth Speaker', 'Portable Bluetooth speaker with clear sound', 54.99, 45, 1, '/images/bluetooth-speaker.jpg'),
('Webcam HD', 'Full HD webcam for online meetings', 49.99, 55, 1, '/images/webcam.jpg'),

-- Clothing (category_id = 2)
('T-Shirt Premium', '100% cotton premium quality t-shirt', 29.99, 200, 2, '/images/tshirt.jpg'),
('Jeans Classic', 'Classic fit denim jeans', 59.99, 150, 2, '/images/jeans.jpg'),
('Hoodie Classic', 'Comfortable cotton blend hoodie', 44.99, 90, 2, '/images/hoodie.jpg'),
('Baseball Cap', 'Adjustable casual baseball cap', 19.99, 120, 2, '/images/baseball-cap.jpg'),
('Winter Jacket', 'Warm jacket for cold weather', 89.99, 40, 2, '/images/winter-jacket.jpg'),
('Travel Backpack', 'Water-resistant backpack for daily travel', 59.99, 65, 2, '/images/backpack.jpg'),

-- Books (category_id = 3)
('Programming Book', 'Learn programming from scratch', 39.99, 80, 3, '/images/book.jpg'),
('SQL Programming Guide', 'Practical guide to SQL and database design', 34.99, 70, 3, '/images/sql-guide.jpg'),

-- Home & Garden (category_id = 4)
('Garden Tools Set', 'Complete set of gardening tools', 49.99, 60, 4, '/images/tools.jpg'),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 34.99, 70, 4, '/images/lamp.jpg'),

-- Sports (category_id = 5)
('Running Shoes', 'Lightweight running shoes for athletes', 89.99, 120, 5, '/images/shoes.jpg'),
('Yoga Mat', 'Non-slip yoga mat for exercises', 24.99, 90, 5, '/images/yogamat.jpg'),

-- Furniture (category_id = 6)
('Desk Organizer', 'Organizer for office supplies and stationery', 18.99, 85, 6, '/images/desk-organizer.jpg'),
('Office Chair', 'Adjustable ergonomic chair for home office', 159.99, 25, 6, '/images/office-chair.jpg'),
('Wooden Bookshelf', 'Compact bookshelf for books and decorations', 119.99, 20, 6, '/images/bookshelf.jpg'),
('LED Desk Light', 'Energy-efficient desk light with adjustable angle', 27.99, 75, 6, '/images/desk-light.jpg'),

-- Beauty (category_id = 7)
('Facial Cleanser', 'Gentle daily facial cleanser', 14.99, 100, 7, '/images/facial-cleanser.jpg'),
('Moisturizing Cream', 'Daily moisturizing cream for skin care', 22.99, 70, 7, '/images/moisturizing-cream.jpg'),
('Makeup Brush Set', 'Set of soft brushes for makeup application', 29.99, 50, 7, '/images/makeup-brush-set.jpg'),

-- Toys & Games (category_id = 8)
('Building Blocks', 'Creative building block set for children', 32.99, 60, 8, '/images/building-blocks.jpg'),
('Board Game', 'Family board game for group entertainment', 24.99, 45, 8, '/images/board-game.jpg'),
('Remote Control Car', 'Remote control toy car for indoor play', 42.99, 35, 8, '/images/rc-car.jpg');