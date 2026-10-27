# FunnyShop MVP – E-Commerce Platform

> **Trạng thái:** 🚧 Đang phát triển (Phase 0/8)

## Tổng quan

FunnyShop MVP là nền tảng thương mại điện tử xây dựng trong 1 tuần sprint. Hệ thống gồm:
- **Frontend:** ReactJS + Vite + Tailwind CSS v4 + Zustand + React Router
- **Backend:** Spring Boot (Java 17) + MySQL + Spring Security (JWT) + Spring AI
- **DevOps:** Docker Compose + GitHub Actions CI/CD

## Cấu trúc dự án (Monorepo)

```
/
├── front/                  # Frontend – React + Vite
├── backend/                # Backend – Spring Boot + Gradle
├── docker-compose.yml      # Orchestration
├── .env.example            # Template biến môi trường
├── task.md                 # Checklist tiến độ
└── SRS_FunnyShop_MVP.md    # Đặc tả yêu cầu (nguồn sự thật)
```

## Chạy nhanh với Docker Compose

```bash
# 1. Copy file môi trường
cp .env.example .env
# Chỉnh sửa .env theo môi trường của bạn

# 2. Build và khởi động toàn hệ thống
docker compose up --build

# 3. Truy cập
# Frontend: http://localhost
# Backend API: http://localhost:8080/api
```

## Chạy trực tiếp (Development)

### Backend
```bash
cd backend
# Cần MySQL chạy sẵn, hoặc dùng: docker compose up mysql -d
./gradlew bootRun
```

### Frontend
```bash
cd front
npm install
npm run dev
# Truy cập http://localhost:5173
```

## Biến môi trường

Xem file [`.env.example`](.env.example) để biết danh sách đầy đủ.

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Tên database | `funnyshop` |
| `DB_USERNAME` | MySQL user | `funnyshop_user` |
| `DB_PASSWORD` | MySQL password | *(không commit)* |
| `JWT_SECRET` | JWT signing key | *(không commit)* |
| `JWT_EXPIRATION_MS` | Thời hạn token (ms) | `86400000` |
| `OPENAI_API_KEY` | OpenAI API key | *(không commit)* |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost` |
| `VITE_API_URL` | Backend URL cho frontend | `http://localhost:8080` |

## Tài khoản mẫu

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@funny.shop` | `Admin@123` |
| Customer | *(đăng ký tự do)* | — |

## Nhánh Git

| Nhánh | Mục đích |
|---|---|
| `main` | Production – trigger CI/CD |
| `dev` | Integration |
| `feature/*` | Feature branches |

## Commit Convention

```
feat(auth): add JWT login endpoint
fix(cart): correct quantity update logic
docs(readme): add environment variables table
```

## Kiến trúc hệ thống

```
Browser (CUSTOMER / ADMIN)
         │ HTTP
         ▼
┌─────────────────────────────────────────────────┐
│              Docker Compose                     │
│  ┌───────────────┐    REST    ┌───────────────┐ │
│  │  Frontend     │ ─────────► │   Backend     │ │
│  │  React+Nginx  │   + JWT    │  Spring Boot  │ │
│  └───────────────┘            └──────┬────────┘ │
│                                      │          │
│                              ┌───────┴───────┐  │
│                              │  MySQL 8      │  │
│                              └───────────────┘  │
└─────────────────────────────────────────────────┘
         ▲ git push main
         │
┌────────┴──────────┐
│  GitHub Actions   │
│  Build → Test →   │
│  Push Docker img  │
└───────────────────┘
```

## Tiến độ

Xem [`task.md`](task.md) để theo dõi chi tiết từng phase.
