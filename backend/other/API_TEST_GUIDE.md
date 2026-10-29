# API Test Guide - Authentication

## Base URL
```
http://localhost:8080
```

## 1. Test Đăng ký (Register)

### 1.1 Đăng ký thành công - User mới
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@gmail.com",
    "password": "123456",
    "fullName": "Test User",
    "phone": "0987654321"
  }'
```

**Expected Response:** 201 Created
```json
{
  "code": 201,
  "message": "Đăng ký tài khoản thành công!",
  "data": {
    "id": 4,
    "username": "testuser",
    "email": "testuser@gmail.com",
    "fullName": "Test User",
    "phone": "0987654321",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

### 1.2 Đăng ký thất bại - Username đã tồn tại
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin2@gmail.com",
    "password": "123456",
    "fullName": "Admin 2",
    "phone": "0987654322"
  }'
```

**Expected Response:** 400 Bad Request
```json
{
  "code": 400,
  "message": "Username đã tồn tại!"
}
```

### 1.3 Đăng ký thất bại - Email đã tồn tại
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user1@gmail.com",
    "password": "123456",
    "fullName": "New User",
    "phone": "0987654323"
  }'
```

**Expected Response:** 400 Bad Request
```json
{
  "code": 400,
  "message": "Email đã tồn tại!"
}
```

### 1.4 Đăng ký thất bại - Validate lỗi (password < 6 ký tự)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "testuser2@gmail.com",
    "password": "123",
    "fullName": "Test User 2",
    "phone": "0987654324"
  }'
```

**Expected Response:** 400 Bad Request (Validation Error)

### 1.5 Đăng ký thất bại - Validate lỗi (email không hợp lệ)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser3",
    "email": "invalid-email",
    "password": "123456",
    "fullName": "Test User 3",
    "phone": "0987654325"
  }'
```

**Expected Response:** 400 Bad Request (Validation Error)

---

## 2. Test Đăng nhập (Login)

### 2.1 Đăng nhập thành công - Admin
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response:** 200 OK
```json
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@funnyshop.com",
      "fullName": "Admin User",
      "phone": "0901234567",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  }
}
```

### 2.2 Đăng nhập thành công - Customer
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "password": "123456"
  }'
```

**Expected Response:** 200 OK
```json
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 2,
      "username": "user1",
      "email": "user1@gmail.com",
      "fullName": "Nguyen Van A",
      "phone": "0912345678",
      "role": "CUSTOMER",
      "status": "ACTIVE"
    }
  }
}
```

### 2.3 Đăng nhập thất bại - Sai password
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }'
```

**Expected Response:** 401 Unauthorized
```json
{
  "code": 401,
  "message": "Yêu cầu xác thực! Token không hợp lệ hoặc đã hết hạn."
}
```

### 2.4 Đăng nhập thất bại - Username không tồn tại
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistent",
    "password": "123456"
  }'
```

**Expected Response:** 401 Unauthorized

### 2.5 Đăng nhập thất bại - Thiếu trường bắt buộc
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin"
  }'
```

**Expected Response:** 400 Bad Request (Validation Error)

---

## 3. Test với JWT Token (Protected Endpoints)

### 3.1 Lưu token từ response đăng nhập
```bash
# Đăng nhập và lưu token vào biến
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.data.accessToken')

echo $TOKEN
```

### 3.2 Gọi API protected với token
```bash
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Thay YOUR_TOKEN_HERE bằng token thực tế từ response đăng nhập**

### 3.3 Test token không hợp lệ
```bash
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response:** 401 Unauthorized

### 3.4 Test thiếu Authorization header
```bash
curl -X GET http://localhost:8080/api/v1/products
```

**Expected Response:** 401 Unauthorized (nếu endpoint cần xác thực)

---

## 4. Test Public Endpoints (Không cần token)

### 4.1 Lấy danh sách sản phẩm (Public)
```bash
curl -X GET http://localhost:8080/api/v1/products
```

**Expected Response:** 200 OK với danh sách products

### 4.2 Lấy danh sách categories (Public)
```bash
curl -X GET http://localhost:8080/api/v1/categories
```

**Expected Response:** 200 OK với danh sách categories

---

## 5. Quick Test Script (PowerShell for Windows)

### 5.1 Test Register
```powershell
$body = @{
    username = "testuser"
    email = "testuser@gmail.com"
    password = "123456"
    fullName = "Test User"
    phone = "0987654321"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 5.2 Test Login
```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Lưu token
$token = $response.data.accessToken
Write-Host "Token: $token"
```

### 5.3 Test với Token
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" `
  -Method GET `
  -Headers $headers
```

---

## 6. Quick Test Script (Bash for Linux/Mac)

### 6.1 Test Register
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@gmail.com",
    "password": "123456",
    "fullName": "Test User",
    "phone": "0987654321"
  }' | jq
```

### 6.2 Test Login và lưu token
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' | jq

# Lưu token vào file
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.data.accessToken' > token.txt

# Đọc token
TOKEN=$(cat token.txt)
echo "Token: $TOKEN"
```

### 6.3 Test với Token
```bash
TOKEN=$(cat token.txt)

curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

---

## 7. Test Data từ data.sql

### Tài khoản có sẵn:
- **Admin:** admin / admin123
- **Customer 1:** user1 / 123456
- **Customer 2:** user2 / 123456

### Test nhanh với tài khoản có sẵn:
```bash
# Login admin
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Login customer
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "123456"}'
```

---

## 8. Troubleshooting

### Server không chạy:
```bash
# Kiểm tra server có đang chạy không
curl http://localhost:8080

# Hoặc kiểm tra port
netstat -an | grep 8080  # Linux/Mac
netstat -an | findstr 8080  # Windows
```

### Lỗi CORS:
- Đảm bảo frontend đang chạy trên http://localhost:5173 hoặc http://localhost:3000
- Kiểm tra SecurityConfig.java đã cấu hình CORS đúng chưa

### Lỗi Database:
- Kiểm tra MySQL có đang chạy không
- Kiểm tra application-dev.yml có cấu hình database đúng chưa
- Xóa database và tạo lại nếu cần

### Reset database:
```sql
DROP DATABASE IF EXISTS funnyshop;
CREATE DATABASE funnyshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Sau đó restart ứng dụng để data.sql tự động chạy.
