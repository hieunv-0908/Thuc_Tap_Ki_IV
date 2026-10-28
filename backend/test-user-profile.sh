#!/bin/bash

# Kịch bản test API User Profile
# Backend URL
BASE_URL="http://localhost:8080"

echo "=========================================="
echo "TEST API USER PROFILE"
echo "=========================================="
echo ""

# Test 1: Login để lấy token
echo "Test 1: Login để lấy JWT token"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser3244","password":"Test@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"
echo ""

# Test 2: GET /api/v1/users/me với token hợp lệ
echo "Test 2: GET /api/v1/users/me với token hợp lệ"
curl -s -X GET "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 3: PUT /api/v1/users/me với data hợp lệ
echo "Test 3: PUT /api/v1/users/me với data hợp lệ"
curl -s -X PUT "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Updated Name","phone":"0912345678"}' | jq '.'
echo ""

# Test 4: PUT /api/v1/users/me với số điện thoại không hợp lệ
echo "Test 4: PUT /api/v1/users/me với số điện thoại không hợp lệ (12345)"
curl -s -X PUT "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","phone":"12345"}' | jq '.'
echo ""

# Test 5: PUT /api/v1/users/me với fullName quá ngắn
echo "Test 5: PUT /api/v1/users/me với fullName quá ngắn (1 ký tự)"
curl -s -X PUT "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"A","phone":"0912345678"}' | jq '.'
echo ""

# Test 6: PUT /api/v1/users/me với fullName quá dài
echo "Test 6: PUT /api/v1/users/me với fullName quá dài (>100 ký tự)"
LONG_NAME=$(printf 'A%.0s' {1..101})
curl -s -X PUT "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"$LONG_NAME\",\"phone\":\"0912345678\"}" | jq '.'
echo ""

# Test 7: GET /api/v1/users/me không có token (should return 401)
echo "Test 7: GET /api/v1/users/me không có token (should return 401)"
curl -s -X GET "$BASE_URL/api/v1/users/me" | jq '.'
echo ""

# Test 8: PUT /api/v1/users/me không có token (should return 401)
echo "Test 8: PUT /api/v1/users/me không có token (should return 401)"
curl -s -X PUT "$BASE_URL/api/v1/users/me" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","phone":"0912345678"}' | jq '.'
echo ""

# Test 9: PUT /api/v1/users/me với token không hợp lệ
echo "Test 9: PUT /api/v1/users/me với token không hợp lệ"
curl -s -X PUT "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","phone":"0912345678"}' | jq '.'
echo ""

echo "=========================================="
echo "HOÀN THÀNH TEST"
echo "=========================================="
