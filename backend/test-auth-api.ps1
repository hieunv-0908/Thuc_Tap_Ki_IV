# API Test Script for Authentication (PowerShell)
# Usage: .\test-auth-api.ps1

$BASE_URL = "http://localhost:8080"

Write-Host "=== Authentication API Test Script ===" -ForegroundColor Yellow
Write-Host ""

# 1. Test Register - Success
Write-Host "1. Test Register - Success (New User)" -ForegroundColor Yellow
$body = @{
    username = "testuser"
    email = "testuser@gmail.com"
    password = "123456"
    fullName = "Test User"
    phone = "0987654321"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    Write-Host "✓ Register new user" -ForegroundColor Green
} catch {
    Write-Host "✗ Register failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. Test Register - Duplicate Username
Write-Host "2. Test Register - Duplicate Username" -ForegroundColor Yellow
$body = @{
    username = "admin"
    email = "admin2@gmail.com"
    password = "123456"
    fullName = "Admin 2"
    phone = "0987654322"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    Write-Host "✗ Should have failed" -ForegroundColor Red
} catch {
    Write-Host "✓ Register with duplicate username failed as expected" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# 3. Test Register - Duplicate Email
Write-Host "3. Test Register - Duplicate Email" -ForegroundColor Yellow
$body = @{
    username = "newuser"
    email = "user1@gmail.com"
    password = "123456"
    fullName = "New User"
    phone = "0987654323"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    Write-Host "✗ Should have failed" -ForegroundColor Red
} catch {
    Write-Host "✓ Register with duplicate email failed as expected" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# 4. Test Login - Admin
Write-Host "4. Test Login - Admin" -ForegroundColor Yellow
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    $ADMIN_TOKEN = $response.data.accessToken
    Write-Host "✓ Login as admin" -ForegroundColor Green
    Write-Host "Admin Token: $($ADMIN_TOKEN.Substring(0, [Math]::Min(50, $ADMIN_TOKEN.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Test Login - Customer
Write-Host "5. Test Login - Customer" -ForegroundColor Yellow
$body = @{
    username = "user1"
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    $CUSTOMER_TOKEN = $response.data.accessToken
    Write-Host "✓ Login as customer" -ForegroundColor Green
    Write-Host "Customer Token: $($CUSTOMER_TOKEN.Substring(0, [Math]::Min(50, $CUSTOMER_TOKEN.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Test Login - Wrong Password
Write-Host "6. Test Login - Wrong Password" -ForegroundColor Yellow
$body = @{
    username = "admin"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    Write-Host "✗ Should have failed" -ForegroundColor Red
} catch {
    Write-Host "✓ Login with wrong password failed as expected" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# 7. Test Login - Non-existent User
Write-Host "7. Test Login - Non-existent User" -ForegroundColor Yellow
$body = @{
    username = "nonexistent"
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    $response | ConvertTo-Json -Depth 10
    Write-Host "✗ Should have failed" -ForegroundColor Red
} catch {
    Write-Host "✓ Login with non-existent user failed as expected" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# 8. Test Protected Endpoint with Token
if ($ADMIN_TOKEN) {
    Write-Host "8. Test Protected Endpoint with Valid Token" -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
    }
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/products" `
            -Method GET `
            -Headers $headers
        $response | ConvertTo-Json -Depth 10
        Write-Host "✓ Access protected endpoint with valid token" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 9. Test Protected Endpoint with Invalid Token
Write-Host "9. Test Protected Endpoint with Invalid Token" -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer invalid_token"
}
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/products" `
        -Method GET `
        -Headers $headers
    $response | ConvertTo-Json -Depth 10
    Write-Host "✗ Should have failed" -ForegroundColor Red
} catch {
    Write-Host "✓ Access with invalid token failed as expected" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# 10. Test Public Endpoint (No Token)
Write-Host "10. Test Public Endpoint (No Token)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/products" -Method GET
    $response | ConvertTo-Json -Depth 10
    Write-Host "✓ Access public endpoint without token" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Green
