# Software Requirements Specification (SRS)
## FunnyShop E-Commerce Platform

### 1. Introduction

#### 1.1 Purpose
This document outlines the requirements for the FunnyShop e-commerce platform, a full-stack web application that allows users to browse products, manage shopping carts, and place orders.

#### 1.2 Scope
The system includes:
- User authentication and authorization
- Product catalog management
- Shopping cart functionality
- Order processing and tracking
- Admin panel for content management

### 2. System Requirements

#### 2.1 Functional Requirements

**User Management**
- Users can register with email and password
- Users can login with credentials
- Users can update their profile
- Admin users have elevated privileges

**Product Management**
- Users can browse all products
- Users can filter products by category
- Users can search products by name
- Admin users can create, update, and delete products

**Shopping Cart**
- Users can add products to cart
- Users can update cart item quantities
- Users can remove items from cart
- Cart persists across sessions

**Order Management**
- Users can place orders from cart
- Users can view order history
- Users can view order details
- Admin users can update order status

#### 2.2 Non-Functional Requirements

**Performance**
- API response time < 200ms for simple queries
- Page load time < 2 seconds
- Support 1000+ concurrent users

**Security**
- Passwords hashed using bcrypt
- JWT token-based authentication
- HTTPS encryption in production
- SQL injection prevention

**Scalability**
- Horizontal scaling capability
- Database connection pooling
- Caching for frequently accessed data

### 3. User Roles

#### 3.1 Customer
- Browse products
- Add to cart
- Place orders
- View order history
- Update profile

#### 3.2 Admin
- All customer privileges
- Manage products (CRUD)
- Manage categories
- View all orders
- Update order status
- Manage users

### 4. Database Schema

#### 4.1 Tables
- **users**: User accounts and authentication
- **categories**: Product categories
- **products**: Product catalog
- **orders**: Customer orders
- **order_items**: Items within orders
- **cart**: Shopping cart functionality

See `database/schema.sql` for detailed schema.

### 5. API Endpoints

#### 5.1 Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login

#### 5.2 Products
- GET `/api/products` - List all products
- GET `/api/products/{id}` - Get product details
- POST `/api/products` - Create product (admin)
- PUT `/api/products/{id}` - Update product (admin)
- DELETE `/api/products/{id}` - Delete product (admin)

#### 5.3 Categories
- GET `/api/categories` - List all categories
- POST `/api/categories` - Create category (admin)

#### 5.4 Cart
- GET `/api/cart` - Get user cart
- POST `/api/cart` - Add item to cart
- PUT `/api/cart/{id}` - Update cart item
- DELETE `/api/cart/{id}` - Remove item from cart

#### 5.5 Orders
- GET `/api/orders` - Get user orders
- POST `/api/orders` - Create order
- GET `/api/orders/{id}` - Get order details
- PUT `/api/orders/{id}/status` - Update order status (admin)

### 6. Technology Stack

#### 6.1 Backend
- Spring Boot 3.x
- Java 17
- Spring Security
- Spring Data JPA
- MySQL 8.0
- JWT Authentication

#### 6.2 Frontend
- React 18
- Vite
- Tailwind CSS
- Zustand (state management)
- Axios (HTTP client)

#### 6.3 DevOps
- Docker
- Docker Compose
- GitHub Actions (CI/CD)
- Nginx (reverse proxy)

### 7. Deployment Architecture

```
┌─────────────┐
│   Nginx     │ (Port 80)
└──────┬──────┘
       │
       ├──────────────┐
       │              │
┌──────▼──────┐  ┌───▼────────┐
│  Frontend   │  │  Backend   │
│  (React)    │  │ (Spring)   │
└─────────────┘  └──────┬─────┘
                        │
                 ┌──────▼──────┐
                 │   MySQL     │
                 │  (Port 3306)│
                 └─────────────┘
```

### 8. Future Enhancements

- Payment gateway integration
- Product reviews and ratings
- Wishlist functionality
- Email notifications
- Product recommendations (AI-powered)
- Multi-language support
- Mobile application
