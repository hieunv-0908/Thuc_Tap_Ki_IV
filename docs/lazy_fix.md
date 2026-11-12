Kế hoạch giải quyết triệt để lỗi LazyInitializationException trong FunnyShop Backend (v3.0 - Production-Grade)

IMPORTANT

Bản kế hoạch phiên bản 3.0 đã khắc phục hoàn toàn 3 cạm bẫy kiến trúc cấp cao:

Bảo vệ Concurrency & Atomic Inventory: Loại bỏ triệt để nguy cơ Lost Update do Hibernate Dirty Checking ghi đè tồn kho khi có nhiều giao dịch mua hàng đồng thời.
Tương thích Hibernate ByteBuddy Proxy: Dùng org.hibernate.Hibernate.getClass() thay cho getClass() thông thường trong equals()/hashCode() để tránh sai lệch khi so sánh đối tượng thực với Lazy Proxy.
Triệt tiêu 
𝑁
+
1
N+1 toàn diện: Đồng bộ cấu hình @BatchSize(size = 30) trên cả 3 collection quan trọng (Order.orderItems, ProductVariant.images, và Product.images) khi fallback ảnh sản phẩm.
Ma trận đánh giá rủi ro & giải pháp kiến trúc v3.0
STT	Cạm bẫy kiến trúc	Nguyên nhân gốc rễ (Root Cause)	Giải pháp tối ưu chuẩn Production
1	Lost Update do Dirty Checking	Khi bỏ clearAutomatically, variant là Managed Entity. Nếu gọi variant.setStockQuantity(...) trên RAM, khi transaction commit Hibernate sẽ tự động bắn câu UPDATE product_variants SET stock_quantity = ? đè lên kết quả atomic update của các luồng khác.	KHÔNG gọi variant.setStockQuantity(...) trên RAM. DTO OrderItemResponse không cần trường tồn kho còn lại của shop, do đó để Database xử lý 100% việc trừ/cộng tồn kho nguyên tử.
2	Proxy Mismatch trong equals()	Hibernate bọc Entity lazy bằng Proxy bytecode (Order$HibernateProxy$...). Nếu dùng getClass() != o.getClass(), việc so sánh Proxy với Entity thật sẽ luôn trả về false dù cùng id.	Dùng org.hibernate.Hibernate.getClass(this) và org.hibernate.Hibernate.getClass(o) để bóc lớp vỏ proxy trước khi kiểm tra kiểu dữ liệu.
3	MultipleBagFetchException	HQL văng lỗi ngay lập tức nếu JOIN FETCH 
≥
2
≥2 collection dạng List (orderItems và images).	Chỉ JOIN FETCH 1 Collection duy nhất là orderItems. Các quan hệ còn lại (user, productVariant, product) là quan hệ đơn @ManyToOne.
4	Sót BatchSize khi Fallback ảnh (
𝑁
+
1
N+1)	Nếu biến thể không có ảnh, hệ thống fallback sang product.getImageUrl(). Nếu thiếu @BatchSize, mỗi biến thể sẽ bắn 1 query lấy ảnh của Product cha.	Đảm bảo cả 3 Collection đều có @BatchSize(size = 30): Order.orderItems, ProductVariant.images, và Product.images.
5	Ghi đè phần tử trong Set khi id == null	Hai transient entity chưa lưu DB đều có id == null. Nếu chỉ so sánh theo id, HashSet sẽ coi chúng là 1 và ghi đè mất phần tử.	Entity khi id == null chỉ bằng nhau khi cùng con trỏ ô nhớ (this == o). hashCode trả về hằng số theo class type.
Chi tiết các bước triển khai kỹ thuật
Giai đoạn 1: Bảo vệ Atomic Inventory & Khắc phục Detached Entity
1. Repository:
File can thiệp:
ProductVariantRepository.java
ProductImageRepository.java
Thay đổi:
Bỏ clearAutomatically = true, chỉ giữ flushAutomatically = true:
java
@Modifying(flushAutomatically = true)
@Query(value = "UPDATE product_variants SET ... WHERE id = :variantId AND stock_quantity >= :qty", nativeQuery = true)
int decrementStockAtomic(@Param("variantId") Long variantId, @Param("qty") Integer qty);
@Modifying(flushAutomatically = true)
@Query(value = "UPDATE product_variants SET ... WHERE id = :variantId", nativeQuery = true)
int incrementStockAtomic(@Param("variantId") Long variantId, @Param("qty") Integer qty);
@Modifying(flushAutomatically = true)
@Query("UPDATE ProductImage pi SET pi.isPrimary = false WHERE pi.product.id = :productId")
int resetPrimaryByProductId(@Param("productId") Long productId);
2. Service Layer - Tuyệt đối không kích hoạt Dirty Checking trên RAM:
File can thiệp: OrderServiceImpl.java
Quy tắc:
Trong cả checkout và updateOrderStatus (khi hủy đơn), TUYỆT ĐỐI KHÔNG GỌI variant.setStockQuantity(...).
Giữ nguyên số lượng tồn kho nguyên tử được kiểm soát 100% tại tầng CSDL.
Vì OrderItemResponse chỉ phản hồi cho khách hàng: quantity (số lượng mua), priceAtOrder, productName, imageUrl, hoàn toàn không có trường stockQuantity, nên việc không sửa trường này trên RAM vừa triệt tiêu lỗi Dirty Checking, vừa bảo toàn tính toàn vẹn song song (concurrency safety) khi hàng nghìn khách hàng cùng checkout.
Giai đoạn 2: Chuẩn hóa Entity JPA - Thay thế @Data & Hibernate Proxy-Safe equals/hashCode
Các file can thiệp:
Order.java
OrderItem.java
Product.java
ProductVariant.java
ProductImage.java
Category.java
1. Bộ Annotation an toàn:

Thay thế @Data bằng:

java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)

Chỉ đánh dấu @ToString.Include trên các trường thông tin cơ bản, không chứa quan hệ Lazy (id, customerName, status, totalAmount, createdAt...).

2. Cài đặt equals() & hashCode() tương thích ByteBuddy Proxy và Transient Entity (id == null):

Áp dụng mẫu chuẩn JPA cho các Entity (ví dụ trên Order):

java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || org.hibernate.Hibernate.getClass(this) != org.hibernate.Hibernate.getClass(o)) {
        return false;
    }
    Order other = (Order) o;
    // Nếu chưa lưu vào DB (id == null), chỉ bằng nhau khi cùng trỏ tới 1 ô nhớ (đã check ở this == o)
    return id != null && id.equals(other.id);
}
@Override
public int hashCode() {
    // Trả về hash code dựa trên Class thực tế đã bóc vỏ proxy để bảo toàn tính bất biến
    return org.hibernate.Hibernate.getClass(this).hashCode();
}
Giai đoạn 3: Triệt tiêu MultipleBagFetchException & Đồng bộ @BatchSize 3 tầng
1. Tối ưu OrderRepository.findByIdWithDetails:
Tránh MultipleBagFetchException: Chỉ fetch 1 collection duy nhất (orderItems).
File can thiệp: OrderRepository.java
java
@Query("SELECT o FROM Order o " +
       "LEFT JOIN FETCH o.user " +
       "LEFT JOIN FETCH o.orderItems oi " +
       "LEFT JOIN FETCH oi.productVariant pv " +
       "LEFT JOIN FETCH pv.product p " +
       "WHERE o.id = :id")
Optional<Order> findByIdWithDetails(@Param("id") Long id);
2. Đồng bộ @BatchSize(size = 30) trên cả 3 Collection:
Tầng 1 - Order.orderItems: Trong Order.java:
java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
@BatchSize(size = 30)
@Builder.Default
private List<OrderItem> orderItems = new ArrayList<>();
Tầng 2 - ProductVariant.images: Trong ProductVariant.java:
java
@OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
@BatchSize(size = 30)
@Builder.Default
private List<ProductImage> images = new ArrayList<>();
Tầng 3 - Product.images: Trong Product.java: Đảm bảo giữ nguyên @BatchSize(size = 30) trên images để khi fallback từ biến thể không có ảnh sang ảnh sản phẩm cha, Hibernate gom các product_id lại và nạp bằng 1 query duy nhất WHERE product_id IN (...), không phát sinh 
𝑁
+
1
N+1.
3. Bổ sung @Transactional(readOnly = true):
Thêm vào CustomUserDetailsService.java cho method loadUserByUsername.
Giai đoạn 4: Toàn vẹn DTO Mapping (Chống Silent Data Loss)
Nguyên tắc: Không dùng Hibernate.isInitialized(...) để che giấu dữ liệu thiếu. DTO Mapper phải nhận được dữ liệu hoàn chỉnh từ các truy vấn đã được nạp sẵn.
File can thiệp: OrderItemResponse.java
Giữ logic lấy variant.getImageUrl().
Vì đã có @BatchSize ở cả variant.images và product.images, mọi lời gọi lấy ảnh đều diễn ra an toàn, nhanh chóng và trả về đầy đủ URL ảnh cho Frontend.
Giai đoạn 5: Kiểm thử tự động & Xác minh hồi quy
Kiểm tra biên dịch:
mvn test-compile: Đảm bảo tất cả Getter/Setter/Builder và phương thức equals/hashCode tương thích 100%.
Kiểm tra Concurrency / Dirty Checking:
Kiểm tra xem sau khi checkout thành công, DB chỉ thực hiện đúng 1 câu lệnh UPDATE trừ kho nguyên tử, không có thêm câu lệnh UPDATE stock_quantity nào được tự động sinh ra khi commit.
Kiểm tra HashSet với id == null:
Viết test tạo 2 OrderItem mới (id = null) 
→
→ thêm vào Set<OrderItem> 
→
→ Assert kích thước size() == 2.
Kiểm tra Hibernate.getClass() với Proxy:
Viết test lấy một Proxy entity và Entity thật cùng id 
→
→ Assert proxy.equals(entity) == true.
Kiểm tra Query findByIdWithDetails:
Đảm bảo câu lệnh HQL parse thành công, không gặp MultipleBagFetchException.
Chạy toàn bộ Regression Tests:
Chạy mvn test đảm bảo các bộ test OrderServiceImplTest, ProductServiceImplTest đều pass.