# TASK-206 -- Test Cases & Test Execution Log

> **Mục đích:** Tài liệu hướng dẫn thực hiện kiểm thử API Product,
> Responsive UI và Shopping Cart trước Sprint 3.\


## 1. Thông tin kiểm thử

  Trường           Thông tin
  ---------------- ------------------------------------------------
  Dự án            Thuc_Tap_Ki_IV
  Task             TASK-206 -- Kiểm thử API Catalog & UI Giỏ hàng
  Người kiểm thử   Nguyễn Ngọc Thanh
  Nhánh Git        Điền nhánh đang sử dụng
  Backend URL      Điền URL thực tế
  Frontend URL     Điền URL thực tế


### Quy ước trạng thái

-   `NOT TESTED`: Chưa thực hiện.
-   `PASS`: Đã thực hiện, kết quả thực tế đúng với mong đợi.
-   `FAIL`: Đã thực hiện, kết quả thực tế không đúng.
-   `BLOCKED`: Không thể thực hiện do thiếu điều kiện hoặc lỗi môi
    trường.
-   `N/A`: Không áp dụng với chức năng hiện tại (ghi rõ lý do).

**Không đánh dấu PASS chỉ vì đã chạy request hoặc đã thao tác.** Phải so
sánh kết quả thực tế với Expected Result.

### Thông tin cần ghi cho mỗi test case

-   **Actual Result:** Kết quả thực tế (HTTP status, nội dung hiển thị,
    số lượng, tổng tiền...).
-   **Evidence:** Tên ảnh chụp, file response hoặc vị trí lưu bằng
    chứng.
-   **Bug ID / Notes:** Mã bug hoặc ghi chú nếu có.

------------------------------------------------------------------------

# 2. QA-01 -- Product API Testing (Postman)

## 2.1. Chuẩn bị

-   [ ] Backend và database đã chạy.
-   [ ] Xác nhận Base URL và API endpoint thực tế từ Controller/API
    documentation.
-   [ ] Có tài khoản ADMIN và CUSTOMER.
-   [ ] Đăng nhập lấy token hợp lệ cho từng role (nếu API dùng JWT).
-   [ ] Tạo Postman Environment và Collection `TASK-206 - Product API`.
-   [ ] Chuẩn bị dữ liệu test và ghi lại ID sản phẩm dùng để kiểm thử.
-   [ ] Xác định response thực tế: danh sách trả về trực tiếp hay bọc
    trong `data`, `content`, `result`...
-   [ ] Xác định chính sách xóa Product: soft delete hay hard delete.

## 2.2. Catalog -- xem danh sách và chi tiết sản phẩm

  ------------------------------------------------------------------------
  ID           Kịch bản /  Kết quả     Actual      Status      Evidence /
               bước thực   mong đợi    Result                  Notes
               hiện                                            
  ------------ ----------- ----------- ----------- ----------- -----------
  API-CAT-01   Gửi request HTTP thành              NOT TESTED  
               lấy danh    công theo                           
               sách        API                                 
               Product với contract;                           
               request hợp response                            
               lệ.         đúng cấu                            
                           trúc; dữ                            
                           liệu là                             
                           danh sách                           
                           sản phẩm.                           

  API-CAT-02   Lấy danh    Có dữ liệu;             NOT TESTED  
               sách khi    các trường                          
               database có quan trọng                          
               sản phẩm.   như ID,                             
                           tên, giá,                           
                           stock đúng                          
                           với dữ liệu                         
                           lưu.                                

  API-CAT-03   Lấy danh    Trả danh                NOT TESTED  
               sách khi    sách rỗng                           
               không có    hoặc                                
               sản phẩm    response                            
               phù hợp.    rỗng theo                           
                           API                                 
                           contract;                           
                           không lỗi                           
                           server.                             

  API-CAT-04   Gửi request HTTP thành              NOT TESTED  
               chi tiết    công; trả                           
               với ID sản  đúng sản                            
               phẩm tồn    phẩm có ID                          
               tại.        yêu cầu.                            

  API-CAT-05   Gửi request HTTP 404                NOT TESTED  
               chi tiết    hoặc mã lỗi                         
               với ID      được quy                            
               không tồn   định trong                          
               tại.        API                                 
                           contract;                           
                           không trả                           
                           nhầm sản                            
                           phẩm.                               

  API-CAT-06   Kiểm tra    Kiểu dữ                 NOT TESTED  
               schema      liệu và các                         
               response    trường khớp                         
               danh        DTO/API                             
               sách/chi    contract;                           
               tiết.       không thiếu                         
                           trường bắt                          
                           buộc.                               

  API-CAT-07   Kiểm tra    Giá/stock               NOT TESTED  
               giá, stock, đúng kiểu                           
               category và và giá trị;                         
               trạng thái  sản phẩm bị                         
               sản phẩm.   xóa/ẩn                              
                           không xuất                          
                           hiện ở                              
                           catalog nếu                         
                           quy tắc                             
                           nghiệp vụ                           
                           yêu cầu.                            
  ------------------------------------------------------------------------

## 2.3. Search và Filter

> Chỉ chạy các test tương ứng với tham số search/filter thực sự được
> Backend hỗ trợ.

  -------------------------------------------------------------------------
  ID          Kịch bản /   Kết quả mong Actual      Status      Evidence /
              bước thực    đợi          Result                  Notes
              hiện                                              
  ----------- ------------ ------------ ----------- ----------- -----------
  API-SF-01   Tìm kiếm     Trả về sản               NOT TESTED  
              bằng từ khóa phẩm phù hợp                         
              khớp tên sản từ khóa theo                         
              phẩm.        quy tắc tìm                          
                           kiếm.                                

  API-SF-02   Tìm kiếm     Danh sách                NOT TESTED  
              bằng từ khóa rỗng hoặc                            
              không tồn    response phù                         
              tại.         hợp; không                           
                           lỗi server.                          

  API-SF-03   Tìm kiếm với Xử lý theo               NOT TESTED  
              từ khóa      API contract                         
              rỗng/không   (thường trả                          
              truyền từ    danh sách                            
              khóa.        mặc định                             
                           hoặc                                 
                           validation                           
                           rõ ràng).                            

  API-SF-04   Lọc theo     Tất cả sản               NOT TESTED  
              category hợp phẩm trả về                          
              lệ.          thuộc                                
                           category                             
                           được chọn.                           

  API-SF-05   Lọc theo     Trả danh                 NOT TESTED  
              category     sách rỗng                            
              không tồn    hoặc lỗi                             
              tại/không    validation                           
              hợp lệ.      theo API                             
                           contract.                            

  API-SF-06   Lọc theo     Giá của mọi              NOT TESTED  
              khoảng giá   sản phẩm nằm                         
              hợp lệ (nếu  trong khoảng                         
              hỗ trợ).     đã gửi.                              

  API-SF-07   Gửi min      Validation               NOT TESTED  
              price lớn    rõ ràng hoặc                         
              hơn max      xử lý theo                           
              price (nếu   API                                  
              hỗ trợ).     contract;                            
                           không lỗi                            
                           500 ngoài dự                         
                           kiến.                                

  API-SF-08   Kết hợp      Mọi kết quả              NOT TESTED  
              search và    thỏa đồng                            
              filter.      thời các                             
                           điều kiện                            
                           được gửi.                            

  API-SF-09   Kiểm tra     Trang, kích              NOT TESTED  
              phân         thước trang                          
              trang/sắp    và thứ tự dữ                         
              xếp (nếu hỗ  liệu đúng                            
              trợ).        tham số.                             
  -------------------------------------------------------------------------

## 2.4. Admin -- Create Product

  ----------------------------------------------------------------------------
  ID            Kịch bản /  Kết quả mong   Actual      Status      Evidence /
                bước thực   đợi            Result                  Notes
                hiện                                               
  ------------- ----------- -------------- ----------- ----------- -----------
  API-CRUD-01   ADMIN tạo   Tạo thành công             NOT TESTED  Ghi lại ID
                Product với theo API                               tạo mới
                toàn bộ dữ  contract                               
                liệu hợp    (thường 201                            
                lệ.         hoặc 200);                             
                            response chứa                          
                            sản phẩm vừa                           
                            tạo.                                   

  API-CRUD-02   Tạo Product HTTP 400 hoặc              NOT TESTED  
                thiếu       lỗi validation                         
                trường bắt  phù hợp; không                         
                buộc (ví dụ tạo dữ liệu                            
                name).      sai.                                   

  API-CRUD-03   Tạo Product Bị từ chối bởi             NOT TESTED  
                với price   validation;                            
                âm.         không tạo sản                          
                            phẩm.                                  

  API-CRUD-04   Tạo Product Bị từ chối bởi             NOT TESTED  
                với stock   validation;                            
                âm.         không tạo sản                          
                            phẩm.                                  

  API-CRUD-05   Tạo Product Bị từ chối                 NOT TESTED  
                với         theo quy tắc                           
                category ID nghiệp vụ;                             
                không tồn   không tạo dữ                           
                tại.        liệu mồ côi.                           

  API-CRUD-06   CUSTOMER    HTTP 403                   NOT TESTED  
                gọi API tạo Forbidden                              
                Product với (hoặc mã được                          
                token hợp   quy định rõ                            
                lệ.         trong security                         
                            contract);                             
                            không tạo sản                          
                            phẩm.                                  

  API-CRUD-07   Không gửi   HTTP 401                   NOT TESTED  
                token khi   Unauthorized                           
                gọi API tạo (nếu endpoint                          
                Product.    yêu cầu đăng                           
                            nhập); không                           
                            tạo sản phẩm.                          

  API-CRUD-08   Gửi token   Bị từ chối xác             NOT TESTED  
                không hợp   thực; không                            
                lệ/hết hạn. tạo sản phẩm.                          
  ----------------------------------------------------------------------------

## 2.5. Admin -- Update Product

  ---------------------------------------------------------------------------
  ID            Kịch bản /  Kết quả mong  Actual      Status      Evidence /
                bước thực   đợi           Result                  Notes
                hiện                                              
  ------------- ----------- ------------- ----------- ----------- -----------
  API-CRUD-09   ADMIN cập   Thành công;               NOT TESTED  
                nhật        dữ liệu trả                           
                Product tồn về và dữ liệu                         
                tại với dữ  đọc lại phản                          
                liệu hợp    ánh thay đổi.                         
                lệ.                                               

  API-CRUD-10   ADMIN cập   HTTP 404 hoặc             NOT TESTED  
                nhật        lỗi nghiệp vụ                         
                Product     theo API                              
                không tồn   contract;                             
                tại.        không tạo mới                         
                            ngoài ý muốn.                         

  API-CRUD-11   Cập nhật    Bị từ chối                NOT TESTED  
                price âm.   validation;                           
                            dữ liệu cũ                            
                            không bị ghi                          
                            đè sai.                               

  API-CRUD-12   Cập nhật    Bị từ chối                NOT TESTED  
                stock âm.   validation;                           
                            dữ liệu cũ                            
                            không bị ghi                          
                            đè sai.                               

  API-CRUD-13   CUSTOMER    Bị từ chối                NOT TESTED  
                gọi API cập quyền; dữ                             
                nhật        liệu không                            
                Product.    thay đổi.                             

  API-CRUD-14   Không có    Bị từ chối                NOT TESTED  
                token gọi   xác thực; dữ                          
                API cập     liệu không                            
                nhật        thay đổi.                             
                Product.                                          
  ---------------------------------------------------------------------------

## 2.6. Admin -- Delete Product

  ---------------------------------------------------------------------------
  ID            Kịch bản /  Kết quả mong  Actual      Status      Evidence /
                bước thực   đợi           Result                  Notes
                hiện                                              
  ------------- ----------- ------------- ----------- ----------- -----------
  API-CRUD-15   ADMIN xóa   Thành công                NOT TESTED  Ghi ID đã
                Product     theo API                              xóa
                test đã     contract;                             
                chuẩn bị.   trạng                                 
                            thái/xóa dữ                           
                            liệu đúng                             
                            thiết kế.                             

  API-CRUD-16   Xóa Product HTTP 404 hoặc             NOT TESTED  
                không tồn   lỗi nghiệp vụ                         
                tại.        theo API                              
                            contract.                             

  API-CRUD-17   CUSTOMER    Bị từ chối                NOT TESTED  
                gọi API xóa quyền;                                
                Product.    Product vẫn                           
                            còn nguyên.                           

  API-CRUD-18   Không có    Bị từ chối                NOT TESTED  
                token gọi   xác thực;                             
                API xóa     Product vẫn                           
                Product.    còn nguyên.                           

  API-CRUD-19   Đọc lại     Product không             NOT TESTED  
                Product sau còn xuất hiện                         
                khi xóa.    theo quy tắc                          
                            soft                                  
                            delete/hard                           
                            delete của dự                         
                            án.                                   
  ---------------------------------------------------------------------------

## 2.7. Kiểm tra lỗi và response chung

  --------------------------------------------------------------------------------
  ID           Kịch bản /     Kết quả mong đợi Actual      Status      Evidence /
               bước thực hiện                  Result                  Notes
  ------------ -------------- ---------------- ----------- ----------- -----------
  API-ERR-01   Gửi JSON sai   HTTP 400 hoặc                NOT TESTED  
               cú pháp.       lỗi parse được                           
                              xử lý; không lộ                          
                              stack trace nội                          
                              bộ.                                      

  API-ERR-02   Gửi            Server trả lỗi               NOT TESTED  
               Content-Type   phù hợp; không                           
               không phù hợp  xử lý sai dữ                             
               (nếu endpoint  liệu.                                    
               yêu cầu JSON).                                          

  API-ERR-03   Gửi ID sai     Lỗi                          NOT TESTED  
               định dạng.     validation/400                           
                              phù hợp; không                           
                              trả 500 ngoài dự                         
                              kiến.                                    

  API-ERR-04   Kiểm tra       Có mã lỗi/thông              NOT TESTED  
               response lỗi.  báo phù hợp API                          
                              contract; không                          
                              lộ thông tin                             
                              nhạy cảm.                                
  --------------------------------------------------------------------------------

## 2.8. Checklist hoàn tất QA-01

-   [ ] Đã chạy tất cả test case áp dụng.
-   [ ] Đã kiểm tra quyền ADMIN.
-   [ ] Đã kiểm tra quyền CUSTOMER.
-   [ ] Đã kiểm tra request không có token/token sai.
-   [ ] Đã kiểm tra response schema và dữ liệu.
-   [ ] Đã ghi rõ test case N/A và lý do.
-   [ ] Đã lưu Postman Collection và Environment (không export token/mật
    khẩu thật).
-   [ ] Đã lưu ảnh hoặc response cho các case quan trọng.
-   [ ] Đã tạo Bug Report cho các case FAIL.

------------------------------------------------------------------------

# 3. QA-02 -- Responsive UI Testing

## 3.1. Chuẩn bị môi trường

Kiểm tra tối thiểu các viewport sau bằng Chrome DevTools → Toggle Device
Toolbar:

  Thiết bị giả lập    Viewport
  ------------------- ------------
  Mobile              375 × 812
  Tablet              768 × 1024
  Desktop nhỏ         1024 × 768
  Desktop tham khảo   1366 × 768

> Kiểm tra thêm bằng cách cuộn dọc và ngang. Không chỉ nhìn phần đầu
> trang.

## 3.2. Admin Dashboard

  ------------------------------------------------------------------------------------------
  ID          Viewport         Kịch bản / bước Kết quả mong Actual     Status     Evidence
                               thực hiện       đợi          Result                
  ----------- ---------------- --------------- ------------ ---------- ---------- ----------
  UI-ADM-01   375px            Mở Admin        Nội dung                NOT TESTED 
                               Dashboard.      không tràn                         
                                               ngang; các                         
                                               khu vực                            
                                               chính vẫn                          
                                               truy cập                           
                                               được.                              

  UI-ADM-02   375px            Kiểm tra        Menu không              NOT TESTED 
                               Sidebar/menu.   che nội                            
                                               dung; có                           
                                               cách thu                           
                                               gọn/mở menu                        
                                               phù hợp                            
                                               thiết kế.                          

  UI-ADM-03   375px            Kiểm tra Topbar Không chồng             NOT TESTED 
                               và các nút thao lấn; nút có                        
                               tác.            thể thao                           
                                               tác.                               

  UI-ADM-04   768px            Mở Dashboard và Card căn                NOT TESTED 
                               kiểm tra các    chỉnh hợp                          
                               card thống kê.  lý; không đè                       
                                               lên nhau.                          

  UI-ADM-05   768px            Kiểm tra        Bảng có cách            NOT TESTED 
                               bảng/danh sách  hiển thị                           
                               sản phẩm.       hoặc cuộn                          
                                               phù hợp;                           
                                               không làm vỡ                       
                                               trang.                             

  UI-ADM-06   1024px           Kiểm tra tổng   Bố cục cân              NOT TESTED 
                               thể Dashboard.  đối; không                         
                                               có phần tử                         
                                               chồng                              
                                               lấn/tràn.                          

  UI-ADM-07   375/768/1024px   Mở form tạo/sửa Input,                  NOT TESTED 
                               sản phẩm (nếu   label,                             
                               có).            button hiển                        
                                               thị rõ và                          
                                               không tràn                         
                                               container.                         

  UI-ADM-08   375/768/1024px   Cuộn đến cuối   Có thể cuộn;            NOT TESTED 
                               trang và thao   nội dung                           
                               tác các nút.    cuối trang                         
                                               không bị                           
                                               che.                               
  ------------------------------------------------------------------------------------------

## 3.3. Customer Catalog

  -------------------------------------------------------------------------------------
  ID          Viewport         Kịch bản / Kết quả mong Actual     Status     Evidence
                               bước thực  đợi          Result                
                               hiện                                          
  ----------- ---------------- ---------- ------------ ---------- ---------- ----------
  UI-CAT-01   375px            Mở trang   Không xuất              NOT TESTED 
                               Catalog.   hiện tràn                          
                                          ngang ngoài                        
                                          ý muốn; bố                         
                                          cục phù hợp                        
                                          mobile.                            

  UI-CAT-02   375px            Kiểm tra   Ảnh, tên,               NOT TESTED 
                               Product    giá và nút                         
                               Card.      không chồng                        
                                          lấn; chữ đọc                       
                                          được.                              

  UI-CAT-03   375px            Kiểm tra   Các control             NOT TESTED 
                               Search và  hiển thị đầy                       
                               Filter.    đủ, thao tác                       
                                          được.                              

  UI-CAT-04   375px            Thao tác   Nút bấm                 NOT TESTED 
                               nút Add to được; phản                         
                               Cart.      hồi UI phù                         
                                          hợp.                               

  UI-CAT-05   768px            Kiểm tra   Các card có             NOT TESTED 
                               số cột     khoảng                             
                               Product    cách/căn                           
                               Grid.      chỉnh hợp                          
                                          lý, không vỡ                       
                                          layout.                            

  UI-CAT-06   768px            Kiểm tra   Không chồng             NOT TESTED 
                               Search,    lấn; có thể                        
                               Filter và  thao tác và                        
                               danh sách. cuộn.                              

  UI-CAT-07   1024px           Mở         Bố cục hiển             NOT TESTED 
                               Catalog.   thị tốt trên                       
                                          desktop theo                       
                                          tiêu chí                           
                                          nghiệm thu.                        

  UI-CAT-08   375/768/1024px   Cuộn đầu   Không kẹt               NOT TESTED 
                               trang đến  cuộn;                              
                               cuối       footer/nội                         
                               trang.     dung cuối                          
                                          truy cập                           
                                          được.                              
  -------------------------------------------------------------------------------------

## 3.4. Shopping Cart -- Responsive Tablet

  -------------------------------------------------------------------------------
  ID           Viewport   Kịch bản / Kết quả     Actual     Status     Evidence
                          bước thực  mong đợi    Result                
                          hiện                                         
  ------------ ---------- ---------- ----------- ---------- ---------- ----------
  UI-CART-01   768px      Mở Cart có Danh sách              NOT TESTED 
                          ít nhất 1  sản phẩm                          
                          sản phẩm.  hiển thị                          
                                     đầy đủ.                           

  UI-CART-02   768px      Kiểm tra   Các thông              NOT TESTED 
                          ảnh, tên,  tin không                         
                          giá, số    đè lên nhau                       
                          lượng.     hoặc bị cắt                       
                                     khó đọc.                          

  UI-CART-03   768px      Kiểm tra   Nút không              NOT TESTED 
                          nút +, -,  bị che và                         
                          xóa.       có thể thao                       
                                     tác.                              

  UI-CART-04   768px      Kiểm tra   Tổng tiền              NOT TESTED 
                          khu vực    hiển thị                          
                          tổng       rõ, không                         
                          tiền/tóm   tràn ngang                        
                          tắt đơn.   hoặc che                          
                                     danh sách.                        

  UI-CART-05   768px      Cuộn trang Cuộn dọc               NOT TESTED 
                          Cart.      bình                              
                                     thường;                           
                                     không có                          
                                     vùng nội                          
                                     dung bị                           
                                     mất.                              

  UI-CART-06   768px      Kiểm tra   Toast nhìn             NOT TESTED 
                          Toast khi  thấy được,                        
                          thao tác   không bị                          
                          Cart.      che hoặc                          
                                     nằm ngoài                         
                                     viewport.                         
  -------------------------------------------------------------------------------

## 3.5. Checklist hoàn tất QA-02

-   [ ] Đã kiểm tra Admin Dashboard ở các viewport áp dụng.
-   [ ] Đã kiểm tra Customer Catalog ở 375px và 1024px.
-   [ ] Đã kiểm tra Cart ở Tablet 768px.
-   [ ] Đã kiểm tra cuộn dọc/ngang.
-   [ ] Đã ghi viewport cụ thể cho mỗi lỗi.
-   [ ] Đã chụp ảnh Desktop, Tablet và Mobile.
-   [ ] Đã tạo Bug Report cho các lỗi giao diện.

------------------------------------------------------------------------

# 4. QA-03 -- Shopping Cart Logic, Stock & LocalStorage

## 4.1. Chuẩn bị dữ liệu

Chọn sản phẩm test có giá và stock đã biết. Ghi lại dữ liệu trước khi
chạy:

  Sản phẩm                            Product ID   Đơn giá   Stock ban đầu
  --------------------------------- ------------ --------- ---------------
  Product A                                                
  Product B                                                
  Product C (stock thấp/0 nếu có)                          

> Dùng sản phẩm test phù hợp và không làm ảnh hưởng dữ liệu thật. Nếu
> cần tạo dữ liệu, chỉ thực hiện bằng tài khoản/môi trường được nhóm cho
> phép.

## 4.2. Thêm sản phẩm và cộng số lượng

  -----------------------------------------------------------------------
  ID          Kịch bản /  Kết quả     Actual      Status      Evidence /
              bước thực   mong đợi    Result                  Notes
              hiện                                            
  ----------- ----------- ----------- ----------- ----------- -----------
  CART-01     Thêm        Sản phẩm                NOT TESTED  
              Product A   xuất hiện;                          
              vào giỏ khi số lượng                            
              stock lớn   ban đầu                             
              hơn 0.      đúng theo                           
                          thiết kế.                           

  CART-02     Thêm lại    Số lượng                NOT TESTED  
              Product A   tăng hoặc                           
              đã có trong xử lý theo                          
              giỏ.        thiết kế;                           
                          không tạo                           
                          dòng trùng                          
                          ngoài ý                             
                          muốn.                               

  CART-03     Nhấn nút    Số lượng                NOT TESTED  
              `+` một     tăng đúng                           
              lần.        1; tổng                             
                          tiền cập                            
                          nhật đúng.                          

  CART-04     Tăng số     Cho phép                NOT TESTED  
              lượng đến   đạt tối đa                          
              đúng stock. bằng stock;                         
                          tổng tiền                           
                          đúng.                               

  CART-05     Thử tăng    Không cho               NOT TESTED  
              vượt stock. số lượng                            
                          vượt stock;                         
                          hiển thị                            
                          Toast cảnh                          
                          báo theo                            
                          yêu cầu.                            

  CART-06     Thêm sản    Không thêm              NOT TESTED  
              phẩm có     được; hiển                          
              stock bằng  thị phản                            
              0 (nếu có). hồi phù                             
                          hợp.                                
  -----------------------------------------------------------------------

## 4.3. Giảm số lượng, xóa và tổng tiền

  -------------------------------------------------------------------------
  ID          Kịch bản /  Kết quả mong  Actual      Status      Evidence /
              bước thực   đợi           Result                  Notes
              hiện                                              
  ----------- ----------- ------------- ----------- ----------- -----------
  CART-07     Nhấn nút    Số lượng giảm             NOT TESTED  
              `-` khi số  đúng 1; tổng                          
              lượng lớn   tiền cập nhật                         
              hơn mức tối đúng.                                 
              thiểu.                                            

  CART-08     Nhấn `-`    Không có số               NOT TESTED  
              tại số      lượng âm/0                            
              lượng tối   ngoài ý muốn;                         
              thiểu.      xử lý theo                            
                          thiết kế (giữ                         
                          1 hoặc xóa).                          

  CART-09     Xóa một sản Chỉ sản phẩm              NOT TESTED  
              phẩm trong  được chọn bị                          
              giỏ có      xóa; sản phẩm                         
              nhiều sản   khác vẫn còn.                         
              phẩm.                                             

  CART-10     Kiểm tra    Tổng tiền =               NOT TESTED  Ghi phép
              tổng tiền   đơn giá × số                          tính
              với một sản lượng theo                            
              phẩm.       quy tắc hiện                          
                          tại.                                  

  CART-11     Kiểm tra    Tổng tiền                 NOT TESTED  Ghi phép
              tổng tiền   bằng tổng                             tính
              với nhiều   thành tiền                            
              sản phẩm.   từng dòng;                            
                          không cộng                            
                          thiếu/thừa.                           

  CART-12     Xóa sản     Cart hiển thị             NOT TESTED  
              phẩm cuối   trạng thái                            
              cùng.       trống đúng                            
                          thiết kế;                             
                          tổng tiền về                          
                          0.                                    
  -------------------------------------------------------------------------

## 4.4. LocalStorage và đồng bộ Zustand

  -------------------------------------------------------------------------------
  ID          Kịch bản / bước Kết quả mong    Actual      Status      Evidence /
              thực hiện       đợi             Result                  Notes
  ----------- --------------- --------------- ----------- ----------- -----------
  CART-13     Thêm sản phẩm   Có dữ liệu cart             NOT TESTED  Ghi key lưu
              vào Cart rồi    được lưu nếu                            trữ
              kiểm tra        ứng dụng thiết                          
              DevTools →      kế persist                              
              Application →   LocalStorage.                           
              Local Storage.                                          

  CART-14     Refresh trang   Cart khôi phục              NOT TESTED  
              sau khi thêm    đúng sản phẩm,                          
              sản phẩm.       số lượng và dữ                          
                              liệu được lưu.                          

  CART-15     Tăng/giảm số    Giá trị sau                 NOT TESTED  
              lượng rồi       refresh khớp                            
              refresh.        trạng thái                              
                              trước refresh.                          

  CART-16     Xóa một sản     Dữ liệu lưu trữ             NOT TESTED  
              phẩm rồi kiểm   phản ánh sản                            
              tra             phẩm đã bị xóa.                         
              LocalStorage.                                           

  CART-17     Xóa hết sản     Cart vẫn trống              NOT TESTED  
              phẩm rồi        sau refresh.                            
              refresh.                                                

  CART-18     Mở Cart sau khi Số lượng và                 NOT TESTED  
              thay đổi dữ     trạng thái giữa                         
              liệu từ         Catalog/Cart                            
              Catalog.        đồng bộ theo                            
                              thiết kế.                               
  -------------------------------------------------------------------------------

## 4.5. Tính đúng đắn của dữ liệu và tình huống biên

  --------------------------------------------------------------------------
  ID          Kịch bản /     Kết quả     Actual      Status      Evidence /
              bước thực hiện mong đợi    Result                  Notes
  ----------- -------------- ----------- ----------- ----------- -----------
  CART-19     Kiểm tra sản   Tổng tiền               NOT TESTED  
              phẩm có giá    chính xác,                          
              lớn và số      không bị                            
              lượng nhiều.   nối chuỗi                           
                             hoặc sai                            
                             định dạng                           
                             số.                                 

  CART-20     Kiểm tra Cart  Ứng dụng xử             NOT TESTED  
              khi dữ liệu    lý an toàn,                         
              LocalStorage   không                               
              không còn hợp  crash; có                           
              lệ (chỉ thực   thể khôi                            
              hiện trong môi phục trạng                          
              trường test).  thái phù                            
                             hợp.                                

  CART-21     Kiểm tra khi   UI không                NOT TESTED  
              thông tin      cho thao                            
              stock của sản  tác vượt                            
              phẩm thay đổi  giới hạn                            
              (nếu có thể mô stock mới                           
              phỏng an       hoặc có                             
              toàn).         thông báo                           
                             phù hợp.                            

  CART-22     Kiểm tra Toast Thông báo               NOT TESTED  
              khi thêm vượt  hiển thị                            
              stock nhiều    rõ; thao                            
              lần.           tác bị                              
                             chặn; UI                            
                             không bị                            
                             treo.                               
  --------------------------------------------------------------------------

## 4.6. Checklist hoàn tất QA-03

-   [ ] Đã test thêm sản phẩm.
-   [ ] Đã test cộng và trừ số lượng.
-   [ ] Đã test xóa sản phẩm.
-   [ ] Đã kiểm tra tổng tiền với một và nhiều sản phẩm.
-   [ ] Đã test giới hạn stock và Toast.
-   [ ] Đã kiểm tra LocalStorage sau thêm/sửa/xóa.
-   [ ] Đã refresh để xác nhận khôi phục dữ liệu.
-   [ ] Đã ghi lại các tình huống không áp dụng và lý do.
-   [ ] Đã tạo Bug Report cho các case FAIL.

------------------------------------------------------------------------

# 5. Bug Report

Tạo một mục riêng cho mỗi lỗi phát hiện. Không chỉ ghi "bị lỗi"; cần có
cách tái hiện.

## Mẫu Bug Report

  Trường                Nội dung
  --------------------- ------------------------------------------
  Bug ID                BUG-206-001
  Liên quan Test Case   Ví dụ: CART-05
  Tiêu đề               Mô tả ngắn lỗi
  Môi trường            Local / Browser / viewport / API URL
  Preconditions         Điều kiện trước khi tái hiện
  Steps to Reproduce    Bước 1, 2, 3...
  Expected Result       Kết quả mong đợi
  Actual Result         Kết quả thực tế
  Severity              Critical / High / Medium / Low
  Evidence              Tên ảnh hoặc response
  Status                Open / Fixed / Retest Pass / Retest Fail

### Danh sách Bug

  Bug ID        Test Case   Tiêu đề   Severity   Status   Evidence
  ------------- ----------- --------- ---------- -------- ----------
  BUG-206-001                                    Open     
  BUG-206-002                                    Open     
  BUG-206-003                                    Open     

Nếu không phát hiện lỗi, ghi rõ
`Không phát hiện Bug trong phạm vi các test case đã thực hiện`, không
cần tạo bug giả.

------------------------------------------------------------------------

# 6. Tổng kết kết quả TASK-206

Điền số liệu sau khi đã thực hiện kiểm thử.

  Nhóm                       Tổng test case áp dụng   PASS   FAIL   BLOCKED   N/A
  ------------------------ ------------------------ ------ ------ --------- -----
  QA-01 -- API                                                              
  QA-02 -- Responsive UI                                                    
  QA-03 -- Cart Logic                                                       
  **Tổng**                                                                  

## Kết luận

-   **QA-01:** \[Chưa kiểm thử / Đang kiểm thử / Hoàn tất -- ghi tỷ lệ
    PASS\]
-   **QA-02:** \[Chưa kiểm thử / Đang kiểm thử / Hoàn tất -- ghi
    viewport đã kiểm tra\]
-   **QA-03:** \[Chưa kiểm thử / Đang kiểm thử / Hoàn tất -- ghi chức
    năng đã kiểm tra\]
-   **Bug còn mở:** \[Số lượng và Bug ID\]
-   **Bằng chứng:** \[Đường dẫn thư mục ảnh/Postman\]
-   **Đề xuất:** \[Các vấn đề cần Developer xử lý trước Sprint 3\]

> Chỉ kết luận TASK-206 đạt nghiệm thu khi các tiêu chí Acceptance
> Criteria đã được kiểm chứng. Nếu còn lỗi hoặc test bị BLOCKED, phải
> nêu rõ trong báo cáo và trao đổi với Lead.

------------------------------------------------------------------------

# 7. Quy tắc chụp và đặt tên bằng chứng

Tạo thư mục:

``` text
TASK-206/
├── TASK-206-Test-Cases.md
├── Postman/
│   └── TASK-206-Product-API.postman_collection.json
├── Evidence/
│   ├── QA-01-API/
│   │   ├── API-CAT-01.png
│   │   ├── API-CRUD-01.png
│   │   └── API-CRUD-06.png
│   ├── QA-02-Responsive/
│   │   ├── UI-CAT-01-Mobile-375.png
│   │   ├── UI-CAT-07-Desktop-1024.png
│   │   └── UI-CART-01-Tablet-768.png
│   └── QA-03-Cart/
│       ├── CART-03-Increase.png
│       ├── CART-05-Stock-Limit.png
│       └── CART-14-LocalStorage-Refresh.png
└── Bug-Reports/
```

Tên ảnh nên chứa Test Case ID để đối chiếu nhanh. Không đưa token, mật
khẩu, cookie hoặc dữ liệu cá nhân vào ảnh/Postman export.

## 8. Điều kiện tự kiểm tra trước khi báo cáo hoàn thành

-   [ ] Mọi test case áp dụng đã có trạng thái cuối cùng.
-   [ ] Mọi case FAIL có Bug Report hoặc ghi chú giải thích.
-   [ ] Mọi case BLOCKED có lý do và người/nhóm cần hỗ trợ.
-   [ ] Các case N/A có lý do rõ ràng.
-   [ ] Đã lưu Postman Collection, không chứa credential thật.
-   [ ] Đã lưu bằng chứng cho các tiêu chí nghiệm thu chính.
-   [ ] Số liệu trong bảng tổng kết khớp với trạng thái từng test case.
-   [ ] Đã báo cáo Lead các lỗi còn mở và phạm vi chưa kiểm thử.
