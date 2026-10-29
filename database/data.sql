-- Sample Data for FunnyShop
-- This script inserts initial data for testing purposes

USE funnyshop;

-- Insert sample users
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@funnyshop.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN'),
('user1', 'user1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER'),
('user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Fashion and apparel items'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home decor and gardening supplies'),
('Sports', 'Sports equipment and accessories');

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category_id, image_url) VALUES
('Laptop Pro 15', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 50, 1, '/images/laptop.jpg'),
('Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 100, 1, '/images/headphones.jpg'),
('Smart Watch', 'Fitness tracking smart watch with heart rate monitor', 299.99, 75, 1, '/images/smartwatch.jpg'),
('T-Shirt Premium', '100% cotton premium quality t-shirt', 29.99, 200, 2, '/images/tshirt.jpg'),
('Jeans Classic', 'Classic fit denim jeans', 59.99, 150, 2, '/images/jeans.jpg'),
('Running Shoes', 'Lightweight running shoes for athletes', 89.99, 120, 5, '/images/shoes.jpg'),
('Programming Book', 'Learn programming from scratch', 39.99, 80, 3, '/images/book.jpg'),
('Garden Tools Set', 'Complete set of gardening tools', 49.99, 60, 4, '/images/tools.jpg'),
('Yoga Mat', 'Non-slip yoga mat for exercises', 24.99, 90, 5, '/images/yogamat.jpg'),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 34.99, 70, 4, '/images/lamp.jpg');
