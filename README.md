# Thiết kế mô hình dữ liệu người dùng và đơn hàng

## 1. Mục tiêu

Thiết kế và hoàn thiện cấu trúc dữ liệu cho dự án FunnyShop, bổ sung các thông tin cần thiết cho người dùng và đơn hàng, đồng thời định hướng tối ưu hiệu suất truy vấn và đảm bảo tính toàn vẹn dữ liệu trong cơ sở dữ liệu MySQL.

## 2. Nội dung thực hiện

### 2.1. Bổ sung thông tin người dùng

Bổ sung các trường thông tin phục vụ quản lý hồ sơ người dùng:

- `full_name`: Họ và tên người dùng, kiểu `VARCHAR(100)`.
- `phone`: Số điện thoại người dùng, kiểu `VARCHAR(20)`.

Các trường này giúp lưu trữ thông tin cá nhân phục vụ quản lý tài khoản và hỗ trợ quá trình mua hàng.

### 2.2. Bổ sung thông tin đơn hàng

Thiết kế bảng `orders` với các thông tin bổ sung phục vụ quá trình đặt hàng:

- `customer_name`: Tên người nhận hàng, kiểu `VARCHAR(100)`, không được để trống.
- `phone`: Số điện thoại người nhận hàng, kiểu `VARCHAR(20)`, không được để trống.
- `payment_method`: Phương thức thanh toán, kiểu `VARCHAR(20)`, giá trị mặc định là `COD`.

Các trường thông tin này cho phép lưu riêng thông tin người nhận và phương thức thanh toán của từng đơn hàng.

### 2.3. Thiết kế quan hệ dữ liệu

Xác định các mối quan hệ giữa những bảng chính trong hệ thống:

- `users` – `orders`: Một người dùng có thể có nhiều đơn hàng.
- `orders` – `order_items`: Một đơn hàng có thể chứa nhiều sản phẩm.
- `products` – `order_items`: Một sản phẩm có thể xuất hiện trong nhiều chi tiết đơn hàng.
- `categories` – `products`: Một danh mục có thể chứa nhiều sản phẩm.
- `users` – `cart`: Một người dùng có thể có nhiều sản phẩm trong giỏ hàng.
- `products` – `cart`: Một sản phẩm có thể xuất hiện trong giỏ hàng của nhiều người dùng.

Các quan hệ được thể hiện thông qua khóa chính và khóa ngoại nhằm duy trì tính liên kết giữa các bảng.

### 2.4. Định hướng tối ưu Index và Constraint

- Xác định các trường cần sử dụng khóa chính (`PRIMARY KEY`) để định danh bản ghi.
- Sử dụng khóa ngoại (`FOREIGN KEY`) để đảm bảo tính toàn vẹn tham chiếu.
- Xác định các trường cần ràng buộc duy nhất (`UNIQUE`), chẳng hạn `username` và `email`.
- Sử dụng `NOT NULL` cho những trường bắt buộc phải có dữ liệu.
- Xem xét bổ sung Index cho các trường thường xuyên được sử dụng trong truy vấn tìm kiếm, lọc và kết nối bảng.

## 3. Kết quả đạt được

- Xây dựng nội dung thiết kế ERD phục vụ quản lý người dùng, danh mục, sản phẩm, giỏ hàng, đơn hàng và chi tiết đơn hàng.
- Xác định các trường thông tin bổ sung cho hồ sơ người dùng và thông tin nhận hàng.
- Làm rõ các mối quan hệ giữa những bảng chính trong hệ thống.
- Xác định các loại ràng buộc và hướng tối ưu Index cần áp dụng cho cơ sở dữ liệu.