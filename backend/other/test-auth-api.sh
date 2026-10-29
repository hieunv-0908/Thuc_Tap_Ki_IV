#!/bin/bash

# API Test Script for Authentication
# Usage: ./test-auth-api.sh

BASE_URL="http://localhost:8080"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Authentication API Test Script ===${NC}"
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# 1. Test Register - Success
echo -e "${YELLOW}1. Test Register - Success (New User)${NC}"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@gmail.com",
    "password": "123456",
    "fullName": "Test User",
    "phone": "0987654321"
  }' | jq '.'
print_result $? "Register new user"
echo ""

# 2. Test Register - Duplicate Username
echo -e "${YELLOW}2. Test Register - Duplicate Username${NC}"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin2@gmail.com",
    "password": "123456",
    "fullName": "Admin 2",
    "phone": "0987654322"
  }' | jq '.'
print_result $? "Register with duplicate username (should fail)"
echo ""

# 3. Test Register - Duplicate Email
echo -e "${YELLOW}3. Test Register - Duplicate Email${NC}"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user1@gmail.com",
    "password": "123456",
    "fullName": "New User",
    "phone": "0987654323"
  }' | jq '.'
print_result $? "Register with duplicate email (should fail)"
echo ""

# 4. Test Login - Admin
echo -e "${YELLOW}4. Test Login - Admin${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')
echo "$ADMIN_RESPONSE" | jq '.'
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.data.accessToken')
print_result $? "Login as admin"
echo -e "${GREEN}Admin Token: ${ADMIN_TOKEN:0:50}...${NC}"
echo ""

# 5. Test Login - Customer
echo -e "${YELLOW}5. Test Login - Customer${NC}"
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "password": "123456"
  }')
echo "$CUSTOMER_RESPONSE" | jq '.'
CUSTOMER_TOKEN=$(echo "$CUSTOMER_RESPONSE" | jq -r '.data.accessToken')
print_result $? "Login as customer"
echo -e "${GREEN}Customer Token: ${CUSTOMER_TOKEN:0:50}...${NC}"
echo ""

# 6. Test Login - Wrong Password
echo -e "${YELLOW}6. Test Login - Wrong Password${NC}"
curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }' | jq '.'
print_result $? "Login with wrong password (should fail)"
echo ""

# 7. Test Login - Non-existent User
echo -e "${YELLOW}7. Test Login - Non-existent User${NC}"
curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistent",
    "password": "123456"
  }' | jq '.'
print_result $? "Login with non-existent user (should fail)"
echo ""

# 8. Test Protected Endpoint with Token
echo -e "${YELLOW}8. Test Protected Endpoint with Valid Token${NC}"
curl -s -X GET "$BASE_URL/api/v1/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
print_result $? "Access protected endpoint with valid token"
echo ""

# 9. Test Protected Endpoint with Invalid Token
echo -e "${YELLOW}9. Test Protected Endpoint with Invalid Token${NC}"
curl -s -X GET "$BASE_URL/api/v1/products" \
  -H "Authorization: Bearer invalid_token" | jq '.'
print_result $? "Access protected endpoint with invalid token (should fail)"
echo ""

# 10. Test Public Endpoint (No Token)
echo -e "${YELLOW}10. Test Public Endpoint (No Token)${NC}"
curl -s -X GET "$BASE_URL/api/v1/products" | jq '.'
print_result $? "Access public endpoint without token"
echo ""

echo -e "${GREEN}=== Test Complete ===${NC}"
