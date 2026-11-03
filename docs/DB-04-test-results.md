# DB-04: Kiểm thử thực thi SQL scripts trên container MySQL local



## 1. Môi trường kiểm thử



- Docker Compose

- MySQL 8.0

- Container: `funnyshop-mysql`

- Database: `funnyshop`

- Cổng kết nối máy host: `3308`



## 2. Kết quả kiểm thử



| STT | Nội dung | Kết quả mong đợi | Kết quả thực tế |

|---|---|---|---|

| 1 | Khởi động MySQL container | Container chạy khỏe mạnh | Đạt — `healthy` |

| 2 | Tạo database | Có database `funnyshop` | Đạt |

| 3 | Thực thi schema SQL | Tạo đủ 6 bảng | Đạt |

| 4 | Nạp dữ liệu users | 3 bản ghi | Đạt |

| 5 | Nạp dữ liệu categories | 5 bản ghi | Đạt |

| 6 | Nạp dữ liệu products | 10 bản ghi | Đạt |

| 7 | Kiểm tra khóa ngoại | Truy vấn thông tin khóa ngoại thành công | Chờ xác nhận |

| 8 | Kiểm tra JOIN sản phẩm và danh mục | Truy vấn thành công | Chờ xác nhận |



## 3. Các bảng được tạo



- `users`

- `categories`

- `products`

- `orders`

- `order\_items`

- `cart`





