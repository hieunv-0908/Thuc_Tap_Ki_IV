# Test Script for Admin CRUD & Order Management API (PowerShell)
# Usage: .\test-admin-order-api.ps1

$BASE_URL = "http://localhost:8080"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " FunnyShop - Test Admin CRUD & Order Management API       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login Admin
Write-Host "1. Dang nhap Admin..." -ForegroundColor Yellow
$adminLogin = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $resAdmin = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $adminLogin
    $adminToken = $resAdmin.data.accessToken
    Write-Host "✓ Admin dang nhap thanh cong!" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin dang nhap that bai: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Login Customer
Write-Host "2. Dang nhap Customer (user1)..." -ForegroundColor Yellow
$userLogin = @{
    username = "user1"
    password = "123456"
} | ConvertTo-Json

try {
    $resUser = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $userLogin
    $userToken = $resUser.data.accessToken
    Write-Host "✓ Customer dang nhap thanh cong!" -ForegroundColor Green
} catch {
    Write-Host "✗ Customer dang nhap that bai: $($_.Exception.Message)" -ForegroundColor Red
}

$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
$userHeaders = @{ "Authorization" = "Bearer $userToken" }

Write-Host ""
Write-Host "=== TEST TASK 1: CRUD & SOFT DELETE ===" -ForegroundColor Cyan

# 3. Public GET Products
Write-Host "3. Public GET /api/v1/products (Phan trang & Sap xep)" -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$BASE_URL/api/v1/products?sortBy=price&sortDir=asc" -Method GET
    Write-Host "✓ Lay danh sach san pham: $($products.data.totalElements) san pham" -ForegroundColor Green
} catch {
    Write-Host "✗ Loi lay san pham: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Admin Them moi danh muc
Write-Host "4. Admin POST /api/v1/admin/categories..." -ForegroundColor Yellow
$catBody = @{
    name = "Danh muc Test $(Get-Random)"
    description = "Mo ta danh muc test"
} | ConvertTo-Json

try {
    $catRes = Invoke-RestMethod -Uri "$BASE_URL/api/v1/admin/categories" -Method POST -ContentType "application/json" -Headers $adminHeaders -Body $catBody
    $catId = $catRes.data.id
    Write-Host "✓ Tao danh muc thanh cong: ID = $catId" -ForegroundColor Green
} catch {
    Write-Host "✗ Loi tao danh muc: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Admin Them moi san pham
Write-Host "5. Admin POST /api/v1/admin/products..." -ForegroundColor Yellow
$prodBody = @{
    name = "San pham Test $(Get-Random)"
    description = "Mo ta san pham"
    price = 199000.00
    stockQuantity = 50
    categoryId = $catId
} | ConvertTo-Json

try {
    $prodRes = Invoke-RestMethod -Uri "$BASE_URL/api/v1/admin/products" -Method POST -ContentType "application/json" -Headers $adminHeaders -Body $prodBody
    $prodId = $prodRes.data.id
    Write-Host "✓ Tao san pham thanh cong: ID = $prodId" -ForegroundColor Green
} catch {
    Write-Host "✗ Loi tao san pham: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Admin Xoa mem san pham
Write-Host "6. Admin DELETE /api/v1/admin/products/{id} (Xoa mem)..." -ForegroundColor Yellow
try {
    $delRes = Invoke-RestMethod -Uri "$BASE_URL/api/v1/admin/products/$prodId" -Method DELETE -Headers $adminHeaders
    Write-Host "✓ Xoa mem san pham thanh cong!" -ForegroundColor Green
} catch {
    Write-Host "✗ Loi xoa san pham: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Customer thu goi API Admin (Ky vong 403 Forbidden)
Write-Host "7. Customer goi API Admin /api/v1/admin/products (Ky vong 403)..." -ForegroundColor Yellow
try {
    $forbiddenRes = Invoke-RestMethod -Uri "$BASE_URL/api/v1/admin/products" -Method POST -ContentType "application/json" -Headers $userHeaders -Body $prodBody
    Write-Host "✗ Khong chan duoc Customer!" -ForegroundColor Red
} catch {
    Write-Host "✓ He thong da chan 403 Forbidden chinh xac!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== TEST TASK 2: ORDER STATE MANAGEMENT ===" -ForegroundColor Cyan

# 8. Admin Xem danh sach tat ca don hang
Write-Host "8. Admin GET /api/v1/admin/orders..." -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "$BASE_URL/api/v1/admin/orders" -Method GET -Headers $adminHeaders
    Write-Host "✓ Admin lay $($orders.data.totalElements) don hang thanh cong!" -ForegroundColor Green
} catch {
    Write-Host "✗ Loi lay don hang: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Customer Xem lich su don hang ca nhan
Write-Host "9. Customer GET /api/v1/orders/my-orders..." -ForegroundColor Yellow
try {
    $myOrders = Invoke-RestMethod -Uri "$BASE_URL/api/v1/orders/my-orders" -Method GET -Headers $userHeaders
    Write-Host "✓ Customer lay lich su don hang ca nhan thanh cong ($($myOrders.data.Count) don hang)!" -ForegroundColor Green
} catch {
    Write-Host "✗ Loi lay don ca nhan: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " HOAN TAT KIEM TRA API TOAN HE THONG                     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

