# FunnyShop — Kiểm thử hệ thống qua giao diện

## 1. Mục đích và phạm vi

Tài liệu này dùng để kiểm tra FunnyShop bằng cách thao tác trực tiếp trên website: đăng ký/đăng nhập, mua hàng, hồ sơ, trang quản trị và hiển thị trên nhiều kích thước màn hình. Không cần Postman, gọi API thủ công, truy vấn database hay xem token trong DevTools.

Mục tiêu là ghi nhận những gì người dùng thực sự nhìn thấy và thao tác được. Nếu tính năng không có trên giao diện hoặc không thể xác minh bằng giao diện, ghi `BLOCKED` hoặc `N/A` kèm lý do; không tự suy đoán PASS.

### Những vấn đề đã nhận thấy khi đối chiếu mã nguồn

- Luồng quên/đặt lại mật khẩu ở frontend gửi dữ liệu không khớp với dữ liệu backend yêu cầu; cần kiểm tra trên UI và ghi lỗi nếu không hoàn tất được.
- Các nút AI gọi đến endpoint backend hiện chưa có trong repository; kết quả mock không được coi là AI backend hoạt động.
- Frontend chưa có chức năng giao diện riêng để refresh token; không cần kiểm tra chức năng này trong bài test UI.
- Trang `/admin` chuyển đến trang quản lý sản phẩm, không phải một Dashboard tổng quan riêng.
- Giỏ hàng được lưu trên trình duyệt; kiểm tra qua giao diện bằng cách tải lại trang, không cần mở LocalStorage.

## 2. Cách chạy và điền kết quả

### Chuẩn bị

1. Mở website bằng trình duyệt và ghi ngày chạy, trình duyệt, kích thước màn hình.
2. Dùng tài khoản và sản phẩm test của nhóm; không thử thao tác tạo/sửa/xóa trên dữ liệu thật.
3. Nếu có lựa chọn chế độ mock, xác nhận đang dùng backend thật khi đánh giá dữ liệu/tích hợp. Nếu không rõ đang dùng mock hay backend, ghi `BLOCKED` — không kết luận dữ liệu hiển thị là dữ liệu hệ thống.
4. Chụp ảnh màn hình khi có kết quả quan trọng hoặc lỗi; trước khi lưu, che email/số điện thoại/thông tin riêng tư nếu cần.

### Trạng thái

| Trạng thái | Khi dùng |
|---|---|
| `PASS` | Đã thao tác trên giao diện và tất cả kết quả mong đợi đều đúng. |
| `FAIL` | Đã thao tác nhưng giao diện/kết quả khác mong đợi hoặc có lỗi. Ghi rõ cách tái hiện và tạo Bug ID. |
| `BLOCKED` | Không thể kiểm tra do thiếu tài khoản, dữ liệu, backend hoặc tính năng chưa dùng được. Ghi lý do. |
| `N/A` | Không áp dụng cho bản đang kiểm thử; ghi lý do. |
| `CHƯA CHẠY` | Chưa thực hiện. |

`Actual Result` ghi ngắn gọn điều thực sự xảy ra, ví dụ: “Hiện lỗi ‘Email đã tồn tại’, không tạo tài khoản mới”. `Evidence / Bug` ghi tên ảnh hoặc Bug ID. Không cần điền mã HTTP, nội dung token hay thông tin database.

**Thông tin lượt chạy**

| Trường | Giá trị |
|---|---|
| Người kiểm thử / ngày | Điền khi bắt đầu |
| Phiên bản / commit nếu biết | Điền nếu có |
| Website đã mở | Điền địa chỉ local/staging |
| Trình duyệt | Ghi tên và phiên bản nếu biết |
| Viewport | Ví dụ: 375×812, 768×1024, 1366×768 |
| Chế độ dữ liệu | Backend thật / Mock / Không xác định |

## 3. Authentication và quyền truy cập

| ID | Thao tác trực tiếp trên giao diện | Kết quả mong đợi | Actual Result                                                                                                               | Trạng thái | Evidence / Bug                                                                                       |
|---|---|---|-----------------------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------|
| AUTH-01 | Mở Đăng ký, nhập username/email/password hợp lệ chưa sử dụng và gửi form. | Tài khoản được tạo; giao diện báo thành công hoặc đưa người dùng đến bước tiếp theo theo thiết kế. Có thể đăng nhập bằng tài khoản mới. | Tài khoản được tạo thành công với role khách hàng                                                                           | PASS       | `Auth-01_Register-success.png`                                                                       |
| AUTH-02 | Đăng ký lần lượt với username đã dùng và email đã dùng. | Mỗi trường hợp được báo rõ là tài khoản đã tồn tại; không báo đăng ký thành công. | Không trùng username hoặc email khi đăng ký                                                                                 | PASS       | `Auth-02_No-duplicate-username-or-mail.png`, `Auth-02_No-duplicate-username-or-mail_2.png`           |
| AUTH-03 | Để trống trường bắt buộc; thử email sai định dạng, username/password quá ngắn hoặc dữ liệu không hợp lệ. | Form chỉ rõ trường cần sửa; không gửi/không tạo tài khoản với dữ liệu sai. | Trường bắt buộc cần được nhập hợp lý trước khi đăng ký                                                                      | PASS       | `Auth-03_Validate.png`                                                                               |
| AUTH-04 | Đăng nhập bằng tài khoản CUSTOMER hợp lệ, đăng xuất, rồi đăng nhập bằng tài khoản ADMIN hợp lệ. | Cả hai đăng nhập được; giao diện hiển thị đúng thông tin/vai trò và điều hướng phù hợp. | Đăng nhập thành công tài khoản user và admin                                                                                | PASS       | `Auth-04_Login-account-user-admin-success.png`, `Auth-04_Login-account-user-admin-success_2.png.png` |
| AUTH-05 | Tại màn hình đăng nhập, thử sai mật khẩu, username/email không tồn tại và bỏ trống trường bắt buộc. | Không đăng nhập được; giao diện cần hiển thị thông báo đủ rõ để người dùng biết thông tin không hợp lệ và cách sửa. | Không thông báo rõ ràng khi nhập thông tin đăng nhập sai                                                                    | FAIL       | `Auth-05_Bug.png`                                                                                    |
| AUTH-06 | Đăng xuất. Sau đó nhập trực tiếp các địa chỉ `/profile`, `/orders`, `/checkout` trên thanh địa chỉ; thử nút Back rồi tải lại trang. | Nội dung riêng tư không được hiển thị như phiên còn đăng nhập; giao diện yêu cầu đăng nhập hoặc chuyển đến trang đăng nhập. Sau khi đăng nhập, trang hoạt động bình thường. | Trang không hiển thị sau khi đăng xuất đăng nhập lại trang hoạt động bình thường                                            | Pass       | `Auth-06.png`                                                                                        |
| AUTH-07 | Đăng nhập bằng CUSTOMER, nhập trực tiếp `/admin`, `/admin/products`, `/admin/orders`, `/admin/users`; sau đó đăng nhập ADMIN và thử lại. | CUSTOMER không xem hoặc thao tác được trang quản trị; có trang thông báo không đủ quyền/Forbidden. ADMIN truy cập được các trang tương ứng. | Thông báo không có quyền truy cập khi truy cập vaào các trang của admin của tk user và truy cập bình thường khi dn tk admin | Pass       | Auth-07.png -> Auth-07_5.png                                                                         |
| AUTH-08 | Dùng chức năng đăng xuất trên website; thử quay lại trang vừa xem bằng nút Back và tải lại. | Giao diện trở về trạng thái chưa đăng nhập; thông tin tài khoản riêng không còn hiện trên trang sau khi tải lại. | Vẫn truy cập được trang web khi đăng xuất bằng nút back                                                                     | Fail       | Auth-08.png                                                                                          |
| AUTH-09 | Mở “Quên mật khẩu”, nhập email hợp lệ của tài khoản test, làm theo bước nhận OTP/xác thực/đặt mật khẩu mới nếu có. Sau đó thử đăng nhập bằng mật khẩu mới. | Quy trình hướng dẫn rõ ràng; OTP/mật khẩu mới được chấp nhận đúng; mật khẩu cũ không còn đăng nhập được. | Thành công thay đổi mật khẩu bằng mã OTP gửi một lần qua mail                                                               | Pass       | Auth-09.png                                                                                          |

## 4. Hồ sơ và trải nghiệm người dùng

| ID | Thao tác trực tiếp trên giao diện | Kết quả mong đợi | Actual Result | Trạng thái | Evidence / Bug |
|---|---|---|---|---|---|
| USER-01 | Đăng nhập CUSTOMER, mở Hồ sơ cá nhân. | Hiển thị đúng thông tin của tài khoản hiện tại; không hiển thị thông tin người dùng khác. |  | CHƯA CHẠY |  |
| USER-02 | Sửa họ tên, số điện thoại hoặc địa chỉ bằng giá trị hợp lệ; lưu rồi tải lại trang/mở lại hồ sơ. | Báo lưu thành công và giá trị mới vẫn được hiển thị sau khi tải lại. |  | CHƯA CHẠY |  |
| USER-03 | Thử lưu hồ sơ với trường bắt buộc trống hoặc số điện thoại sai định dạng. | Có hướng dẫn sửa lỗi; không báo lưu thành công với dữ liệu sai. |  | CHƯA CHẠY |  |
| USER-04 | Mở các trang chính bằng CUSTOMER rồi đăng xuất; thử truy cập lại trang riêng tư. | Điều hướng nhất quán; không hiển thị hồ sơ/đơn hàng riêng tư khi chưa đăng nhập. |  | CHƯA CHẠY |  |

## 5. Catalog và thao tác mua sắm

| ID | Thao tác trực tiếp trên giao diện | Kết quả mong đợi | Actual Result | Trạng thái | Evidence / Bug |
|---|---|---|---|---|---|
| CAT-01 | Mở trang chủ/catalog khi chưa đăng nhập; xem danh sách, ảnh, tên, giá và danh mục. | Catalog xem được; thông tin sản phẩm hiển thị đầy đủ, không có lỗi/trang trắng. |  | CHƯA CHẠY |  |
| CAT-02 | Tìm sản phẩm bằng từ khóa có kết quả, từ khóa không có kết quả và xóa từ khóa. | Danh sách cập nhật đúng; trường hợp không có kết quả có thông báo/trạng thái rỗng dễ hiểu. |  | CHƯA CHẠY |  |
| CAT-03 | Chọn một danh mục, đổi cách sắp xếp và chuyển trang nếu có. | Kết quả tương ứng với lựa chọn; không lặp/mất dữ liệu bất thường; có thể quay về lựa chọn mặc định. |  | CHƯA CHẠY |  |
| CAT-04 | Mở chi tiết một sản phẩm từ card sản phẩm; quay lại catalog. | Chi tiết đúng sản phẩm đã chọn; thông tin dễ đọc; quay lại không gây lỗi. |  | CHƯA CHẠY |  |
| CAT-05 | Thử tìm bộ lọc khoảng giá trên giao diện. | Chỉ kiểm thử nếu giao diện hiện có chức năng này. Nếu không có, ghi `N/A` — UI hiện chưa hỗ trợ lọc khoảng giá; không xem là lỗi API. |  | CHƯA CHẠY |  |
| CAT-06 | Thử mở trang quản lý sản phẩm bằng CUSTOMER và ADMIN. | CUSTOMER bị chặn; ADMIN thấy được danh sách và thao tác quản trị sản phẩm. |  | CHƯA CHẠY |  |

## 6. Giỏ hàng và checkout

| ID | Thao tác trực tiếp trên giao diện | Kết quả mong đợi | Actual Result | Trạng thái | Evidence / Bug |
|---|---|---|---|---|---|
| CART-01 | Thêm một sản phẩm còn hàng vào giỏ. | Sản phẩm xuất hiện trong giỏ; số lượng, biểu tượng/số đếm giỏ cập nhật. |  | CHƯA CHẠY |  |
| CART-02 | Thêm lại sản phẩm đã có trong giỏ. | Số lượng tăng theo thiết kế; không xuất hiện dòng trùng không cần thiết. |  | CHƯA CHẠY |  |
| CART-03 | Trong giỏ, tăng/giảm số lượng và đối chiếu đơn giá × số lượng với thành tiền/tổng tiền. | Số lượng và tổng tiền cập nhật đúng ngay trên giao diện. |  | CHƯA CHẠY |  |
| CART-04 | Tăng số lượng đến tồn kho tối đa rồi thử tăng thêm; thử thêm sản phẩm hết hàng nếu có. | Không cho vượt số lượng có thể mua; thông báo phù hợp, giao diện không bị treo. |  | CHƯA CHẠY |  |
| CART-05 | Xóa một sản phẩm trong giỏ có nhiều sản phẩm; sau đó thử xóa toàn bộ. | Chỉ sản phẩm được chọn bị xóa; tổng tiền cập nhật; xóa toàn bộ có xác nhận và đưa giỏ về trạng thái trống. |  | CHƯA CHẠY |  |
| CART-06 | Có sản phẩm trong giỏ, tải lại trang hoặc rời trang rồi quay lại giỏ. | Giỏ vẫn giữ đúng sản phẩm/số lượng theo thiết kế. |  | CHƯA CHẠY |  |
| CART-07 | Đăng xuất/đăng nhập lại hoặc mở cùng website ở tab khác sau khi có dữ liệu giỏ. | Ghi nhận giỏ được giữ hay thay đổi theo thiết kế mong muốn; không tự xóa dữ liệu ngoài ý muốn. |  | CHƯA CHẠY |  |
| ORDER-01 | Chọn đặt hàng khi chưa đăng nhập. | Website yêu cầu đăng nhập; sau khi đăng nhập có thể tiếp tục mua hàng hoặc hướng dẫn rõ bước kế tiếp. |  | CHƯA CHẠY |  |
| ORDER-02 | Checkout khi đã đăng nhập: thử để trống họ tên, sai số điện thoại, địa chỉ ngắn; sau đó điền dữ liệu hợp lệ. | Validation hiển thị đúng; đơn chỉ được gửi khi thông tin hợp lệ. |  | CHƯA CHẠY |  |
| ORDER-03 | Đặt đơn hợp lệ với sản phẩm còn hàng; kiểm tra màn hình xác nhận và lịch sử đơn. | Báo đặt hàng thành công, có mã/chi tiết đơn; đơn xuất hiện trong lịch sử với trạng thái ban đầu phù hợp; giỏ được làm trống. |  | CHƯA CHẠY |  |
| ORDER-04 | Thử checkout khi sản phẩm trong giỏ vừa hết hàng/không còn bán (nếu có thể chuẩn bị dữ liệu an toàn). | Đơn không báo thành công; có thông báo rõ; giỏ không bị mất để người dùng xử lý lại. |  | CHƯA CHẠY |  |
| ORDER-05 | Mở chi tiết đơn từ lịch sử; thử dùng CUSTOMER khác mở đơn không thuộc mình nếu có tài khoản test. | Người mua xem được đơn của mình; không truy cập được đơn người khác. |  | CHƯA CHẠY |  |

## 7. Chức năng quản trị

| ID | Thao tác trực tiếp trên giao diện | Kết quả mong đợi | Actual Result | Trạng thái | Evidence / Bug |
|---|---|---|---|---|---|
| ADM-01 | Đăng nhập ADMIN; mở `/admin` và lần lượt các trang Sản phẩm, Danh mục, Đơn hàng, Người dùng. | Các trang quản lý truy cập được; `/admin` mở trang quản lý sản phẩm theo điều hướng hiện tại. |  | CHƯA CHẠY |  |
| ADM-02 | Tạo sản phẩm test qua form với dữ liệu hợp lệ; kiểm tra sản phẩm trong danh sách/catalog. | Thông báo thành công; dữ liệu mới hiển thị đúng ở khu vực quản lý và catalog nếu đang bán. |  | CHƯA CHẠY | Chỉ dùng dữ liệu test |
| ADM-03 | Thử tạo/sửa sản phẩm với tên trống, giá/tồn kho âm hoặc thiếu danh mục. | Form chỉ rõ dữ liệu cần sửa; không báo thành công và không tạo dữ liệu sai. |  | CHƯA CHẠY |  |
| ADM-04 | Sửa sản phẩm test; tải lại danh sách và xem catalog. | Giá/thông tin mới được lưu và hiển thị nhất quán. |  | CHƯA CHẠY |  |
| ADM-05 | Ẩn/xóa mềm sản phẩm test, xác nhận hộp thoại nếu có; kiểm tra catalog. Khôi phục lại nếu có chức năng. | Sản phẩm ẩn không còn xuất hiện cho khách; thao tác khôi phục đưa sản phẩm trở lại nếu UI hỗ trợ. |  | CHƯA CHẠY |  |
| ADM-06 | Tạo, sửa, ẩn danh mục test; kiểm tra bộ lọc/catalog sau mỗi thao tác. | Thông tin danh mục được cập nhật; danh mục ẩn không còn được khách chọn hoặc nhìn thấy theo thiết kế. |  | CHƯA CHẠY | Chỉ dùng dữ liệu test |
| ADM-07 | Mở một đơn test trong trang quản trị; chuyển trạng thái theo các bước hệ thống cho phép. | Trạng thái mới hiển thị ở chi tiết/danh sách; trạng thái không hợp lệ không được lưu và có thông báo. |  | CHƯA CHẠY | Không dùng đơn thật |
| ADM-08 | Trong trang quản lý người dùng, tìm user test và thử đổi trạng thái. | Tìm kiếm và cập nhật trạng thái phản ánh đúng trên danh sách sau khi tải lại. |  | CHƯA CHẠY | Không khóa tài khoản thật |
| ADM-09 | CUSTOMER thử truy cập hoặc nhấn các chức năng tạo/sửa/xóa trong trang quản trị. | Không thể truy cập/thực hiện hành động quản trị. |  | CHƯA CHẠY |  |
| ADM-10 | Mở form AI tạo mô tả/tạo dữ liệu mẫu nếu giao diện có; nhấn thao tác và quan sát kết quả. | Nếu chỉ mock, ghi rõ là mock. Tích hợp backend chỉ PASS khi tính năng thực sự hoạt động với dịch vụ backend; lỗi endpoint/không phản hồi ghi FAIL hoặc BLOCKED, không coi nội dung mẫu là kết quả AI thật. |  | CHƯA CHẠY | Backend hiện chưa có endpoint AI tương ứng |

## 8. Kiểm tra giao diện responsive và lỗi dễ thấy

Thực hiện trên các trang chính ở những kích thước có thể kiểm tra: điện thoại **375×812**, tablet **768×1024**, desktop nhỏ **1024×768**, desktop **1366×768**. Có thể đổi kích thước cửa sổ trình duyệt hoặc dùng chế độ responsive của trình duyệt.

| ID | Thao tác trực tiếp trên giao diện | Kết quả mong đợi | Actual Result | Trạng thái | Evidence / Bug |
|---|---|---|---|---|---|
| UI-01 | Mở catalog, chi tiết sản phẩm và tìm kiếm ở các viewport. | Không tràn ngang ngoài chủ ý; card/ảnh/chữ/nút không đè lên nhau; các control dùng được. |  | CHƯA CHẠY | Ghi viewport vào tên ảnh |
| UI-02 | Mở giỏ hàng và checkout ở mobile/tablet/desktop; thao tác số lượng và nút đặt hàng. | Nội dung không bị cắt; tổng tiền và nút chính nhìn thấy, thao tác được; bàn phím mobile không che hoàn toàn trường đang nhập. |  | CHƯA CHẠY |  |
| UI-03 | Mở trang ADMIN và các bảng trên mobile/tablet/desktop; mở menu mobile, modal và form. | Menu mở/đóng được; bảng có thể xem/cuộn phù hợp; modal/form không vượt khỏi màn hình; không chồng lấn nghiêm trọng. |  | CHƯA CHẠY |  |
| UI-04 | Cuộn từng trang từ đầu đến cuối; kiểm tra toast, nút cuối form và footer. | Cuộn hoạt động; không có nội dung/nút quan trọng bị che hoặc không thể thao tác. |  | CHƯA CHẠY |  |
| UI-05 | Tải lại trang, dùng nút Back/Forward, mở đường dẫn không tồn tại hoặc dữ liệu không còn hợp lệ. | Website không trắng/crash; trang Not Found, thông báo lỗi hoặc điều hướng phù hợp; người dùng có cách quay về trang chính. |  | CHƯA CHẠY |  |
| UI-06 | Mô phỏng thao tác khi backend không phản hồi nếu có môi trường test phù hợp; thử tải danh sách/lưu form. | Có thông báo lỗi và cách thử lại; không hiện thành công giả hoặc mất dữ liệu đang nhập ngoài ý muốn. |  | CHƯA CHẠY | Không chủ động làm gián đoạn production |

## 9. Ghi nhận bug

Tạo một bản ghi cho mỗi lỗi đã thấy trên giao diện. Không tạo Bug ID giả trước khi lỗi được tái hiện.

| Trường | Nội dung |
|---|---|
| Bug ID / Test Case ID |  |
| Tiêu đề ngắn |  |
| Tài khoản test / trình duyệt / viewport | Không ghi mật khẩu |
| Các bước tái hiện | Ghi lần lượt từng bước |
| Kết quả mong đợi |  |
| Kết quả thực tế |  |
| Ảnh bằng chứng | Che thông tin cá nhân nếu có |
| Mức độ / trạng thái | Critical / High / Medium / Low; Open / Fixed / Retest Pass / Retest Fail |

Ví dụ: `AUTH-05` — nhập sai mật khẩu — hệ thống không hiển thị thông báo dễ hiểu — `Auth-05_Bug.png`.

## 10. Tổng kết lượt kiểm thử

Chỉ đếm các case đã thao tác thực tế. `CHƯA CHẠY` không tính là PASS. Ghi lý do cho BLOCKED/N/A.

| Nhóm | Tổng áp dụng | PASS | FAIL | BLOCKED | N/A | CHƯA CHẠY |
|---|---:|---:|---:|---:|---:|---:|
| AUTH / USER |  |  |  |  |  |  |
| Catalog / Giỏ hàng / Đơn hàng |  |  |  |  |  |  |
| Quản trị |  |  |  |  |  |  |
| Responsive / Lỗi giao diện |  |  |  |  |  |  |
| **Tổng** |  |  |  |  |  |  |

**Kết luận:** Ghi những phần đã kiểm tra và hoạt động tốt, các lỗi còn lại (Bug ID), những phần BLOCKED/N/A và môi trường/trình duyệt đã dùng. Chỉ nói “hệ thống ổn” trong phạm vi các case đã chạy; không suy rộng sang chức năng chưa kiểm thử.

## 11. Lưu bằng chứng

```text
TestCase-local/
├── Test-Case.md
├── Evidence/
│   ├── AUTH-01-register-success.png
│   └── ...
└── Bugs/
```

Tên ảnh nên có Test Case ID và viewport khi kiểm thử responsive, ví dụ `UI-03-admin-mobile-375.png`. Không chụp/lưu mật khẩu, OTP, token hoặc thông tin cá nhân thật.
