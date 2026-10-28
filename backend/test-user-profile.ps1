# Kịch bản test API User Profile (PowerShell)
# Backend URL
$BASE_URL = "http://localhost:8080"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST API USER PROFILE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login để lấy token
Write-Host "Test 1: Login để lấy JWT token" -ForegroundColor Yellow
$loginBody = @{
    username = "testuser3244"
    password = "Test@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$TOKEN = $loginResponse.data.accessToken
Write-Host "Token: $TOKEN" -ForegroundColor Green
Write-Host ""

# Test 2: GET /api/v1/users/me với token hợp lệ
Write-Host "Test 2: GET /api/v1/users/me với token hợp lệ" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $TOKEN"
}
$response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
    -Method GET `
    -Headers $headers
$response | ConvertTo-Json -Depth 10
Write-Host ""

# Test 3: PUT /api/v1/users/me với data hợp lệ
Write-Host "Test 3: PUT /api/v1/users/me với data hợp lệ" -ForegroundColor Yellow
$updateBody = @{
    fullName = "Updated Name"
    phone = "0912345678"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
    -Method PUT `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $updateBody
$response | ConvertTo-Json -Depth 10
Write-Host ""

# Test 4: PUT /api/v1/users/me với số điện thoại không hợp lệ
Write-Host "Test 4: PUT /api/v1/users/me với số điện thoại không hợp lệ (12345)" -ForegroundColor Yellow
$invalidPhoneBody = @{
    fullName = "Test User"
    phone = "12345"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
        -Method PUT `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $invalidPhoneBody
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: PUT /api/v1/users/me với fullName quá ngắn
Write-Host "Test 5: PUT /api/v1/users/me với fullName quá ngắn (1 ký tự)" -ForegroundColor Yellow
$shortNameBody = @{
    fullName = "A"
    phone = "0912345678"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
        -Method PUT `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $shortNameBody
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: PUT /api/v1/users/me với fullName quá dài
Write-Host "Test 6: PUT /api/v1/users/me với fullName quá dài (>100 ký tự)" -ForegroundColor Yellow
$longName = "A" * 101
$longNameBody = @{
    fullName = $longName
    phone = "0912345678"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
        -Method PUT `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $longNameBody
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 7: GET /api/v1/users/me không có token (should return 401)
Write-Host "Test 7: GET /api/v1/users/me không có token (should return 401)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" -Method GET
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 8: PUT /api/v1/users/me không có token (should return 401)
Write-Host "Test 8: PUT /api/v1/users/me không có token (should return 401)" -ForegroundColor Yellow
$noTokenBody = @{
    fullName = "Test"
    phone = "0912345678"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
        -Method PUT `
        -ContentType "application/json" `
        -Body $noTokenBody
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 9: PUT /api/v1/users/me với token không hợp lệ
Write-Host "Test 9: PUT /api/v1/users/me với token không hợp lệ" -ForegroundColor Yellow
$invalidTokenHeaders = @{
    Authorization = "Bearer invalid_token"
}

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/users/me" `
        -Method PUT `
        -Headers $invalidTokenHeaders `
        -ContentType "application/json" `
        -Body $noTokenBody
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HOÀN THÀNH TEST" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
