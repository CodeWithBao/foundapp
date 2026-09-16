# DANH SÁCH & ĐẶC TẢ USE CASES (USE CASES DOCUMENTATION)
## DỰ ÁN UNIFIND DNTU - HỆ THỐNG QUẢN LÝ TÀI SẢN THẤT LẠC

---

### UC01: ĐĂNG KÝ TÀI KHOẢN (REGISTER)
- **Actor**: Sinh viên / Người dùng mới
- **Precondition**: Chưa đăng nhập hệ thống.
- **Main Flow**:
  1. Người dùng truy cập trang `/register`.
  2. Nhập họ tên, email `@dntu.edu.vn`, mã sinh viên, số điện thoại và mật khẩu.
  3. Hệ thống kiểm tra trùng lặp email và mã hóa mật khẩu (`bcrypt`).
  4. Tạo tài khoản mới status `ACTIVE` và cấp JWT Token.
- **Postcondition**: Người dùng tự động đăng nhập và được chuyển về trang cá nhân.

---

### UC02: ĐĂNG NHẬP & XÁC THỰC (LOGIN & JWT AUTH)
- **Actor**: User, Staff, Admin
- **Precondition**: Đã có tài khoản trên hệ thống.
- **Main Flow**:
  1. Người dùng truy cập trang `/login`.
  2. Nhập Email và Mật khẩu.
  3. Backend đối chiếu email và hash mật khẩu, kiểm tra trạng thái tài khoản.
  4. Trả về JWT Token chứa thông tin User ID và Role.
- **Postcondition**: Token được lưu tại LocalStorage, header tự động gắn `Authorization: Bearer <token>`.

---

### UC03: BÁO MẤT ĐỒ (REPORT LOST ITEM)
- **Actor**: User
- **Precondition**: Đã đăng nhập.
- **Main Flow**:
  1. Người dùng chọn "Báo mất đồ" (`/report-lost`).
  2. Điền thông tin: Tiêu đề, Danh mục, Địa điểm nghi ngờ mất, Ngày/Giờ, Mô tả đặc điểm, Màu sắc, Thương hiệu, Ảnh minh họa.
  3. Gửi form -> Backend khởi tạo bài đăng loại `LOST` với status `LOST`.
  4. Hệ thống kích hoạt thuật toán Matching tự động (Strategy Pattern).
- **Postcondition**: Bài đăng xuất hiện trên danh sách đồ mất và hệ thống tìm đồ tương thích.

---

### UC04: BÁO NHẶT ĐƯỢC ĐỒ (REPORT FOUND ITEM)
- **Actor**: User / Staff
- **Precondition**: Đã đăng nhập.
- **Main Flow**:
  1. Người dùng chọn "Báo nhặt được" (`/report-found`).
  2. Điền thông tin vật phẩm nhặt được, nơi nhặt, tình trạng lưu trữ (tự giữ hoặc nộp Văn phòng Đoàn).
  3. Gửi form -> Backend tạo bài đăng `FOUND` với status `FOUND`.
  4. Kích hoạt thuật toán Matching tính điểm tương thích với các bài báo mất.
- **Postcondition**: Bài đăng hiển thị công khai để chủ sở hữu nhận diện.

---

### UC05: TÌM KIẾM & LỌC TÀI SẢN (SEARCH & FILTER)
- **Actor**: Tất cả người dùng
- **Precondition**: Không có.
- **Main Flow**:
  1. Truy cập trang Tìm kiếm (`/search`).
  2. Nhập từ khóa tìm kiếm (theo tên, mô tả, màu sắc, nhãn hiệu).
  3. Lọc theo Danh mục (Điện tử, Giấy tờ, Ví...), Địa điểm (Nhà A, Thư viện...), Trạng thái.
  4. Hệ thống truy vấn database và hiển thị kết quả phân trang (Pagination).
- **Postcondition**: Hiển thị danh sách vật phẩm khớp điều kiện.

---

### UC06: GỢI Ý KHỚP ĐỒ TỰ ĐỘNG (MATCHING SUGGESTIONS)
- **Actor**: User
- **Precondition**: Đã đăng bài báo mất hoặc báo nhặt được.
- **Main Flow**:
  1. Người dùng vào trang "Gợi ý phù hợp" (`/matches`).
  2. Backend sử dụng **Strategy Pattern** (`CategoryLocationMatchingStrategy`) tính điểm tương quan giữa đồ mất và đồ nhặt được dựa trên:
     - Danh mục trùng hợp (Score +30)
     - Địa điểm trùng hợp (Score +30)
     - Khớp từ khóa tiêu đề & màu sắc (Score +20)
     - Ngày tháng gần nhau (Score +20)
  3. Lọc các cặp vật phẩm có Match Score >= 40%.
- **Postcondition**: Hiển thị danh sách gợi ý kèm % tỷ lệ khớp đồ.

---

### UC07: GỬI YÊU CẦU NHẬN LẠI ĐỒ (SUBMIT CLAIM)
- **Actor**: User (Chủ sở hữu đồ bị mất)
- **Precondition**: Đã đăng nhập, vật phẩm ở trạng thái `FOUND`.
- **Main Flow**:
  1. Người dùng xem chi tiết vật phẩm `FOUND` và nhấn "Gửi yêu cầu nhận đồ".
  2. Điền lý do, thông tin chứng minh (chi tiết bảo mật chỉ chủ đồ mới biết), tải ảnh bằng chứng.
  3. **ClaimFacade** kiểm tra nghiệp vụ:
     - Không cho phép tự claim đồ do chính mình đăng (`BR03`).
     - Vật phẩm không ở trạng thái khóa/đã trả (`BR04`).
     - Người dùng chưa có claim active trùng lặp (`BR05`).
  4. Khởi tạo bản ghi Claim status `PENDING`.
  5. Phát sự kiện thông báo qua **Observer Pattern**.
- **Postcondition**: Đã gửi Yêu cầu nhận đồ tới Cán bộ/Người nhặt.

---

### UC08: CÁN BỘ KIỂM DUYỆT YÊU CẦU (STAFF REVIEW CLAIM)
- **Actor**: Staff / Admin
- **Precondition**: Đăng nhập tài khoản Staff.
- **Main Flow**:
  1. Cán bộ truy cập Quản lý Claim (`/staff/claims`).
  2. Xem thông tin bằng chứng người yêu cầu cung cấp và đối chiếu với vật phẩm thực tế.
  3. Chọn hành động: `Duyệt yêu cầu (Approve)` hoặc `Từ chối (Reject)`.
  4. **ClaimFacade** cập nhật trạng thái Claim và phát sự kiện thông báo cho Sinh viên qua Observer Pattern.
- **Postcondition**: Trạng thái Claim cập nhật, sinh viên nhận thông báo kết quả.

---

### UC09: XÁC NHẬN BÀN GIAO TRẢ ĐỒ (STAFF HANDOVER ITEM)
- **Actor**: Staff
- **Precondition**: Claim đã ở trạng thái `APPROVED` hoặc `READY_FOR_HANDOVER`.
- **Main Flow**:
  1. Sinh viên mang thẻ sinh viên/CCCD đến văn phòng gặp Cán bộ tiếp nhận.
  2. Cán bộ kiểm tra thông tin và nhấn "Xác nhận bàn giao".
  3. Nhập tên người nhận, MSSV, ghi chú và địa điểm bàn giao.
  4. **ClaimFacade** tạo bản ghi HandoverRecord, cập nhật vật phẩm sang `RETURNED` và đóng bài đăng.
- **Postcondition**: Hoàn tất quy trình trả đồ, vật phẩm chuyển sang trạng thái đã trao trả thành công.

---

### UC10: HỆ THỐNG THÔNG BÁO (NOTIFICATION SYSTEM)
- **Actor**: User, Staff, Admin
- **Precondition**: Có sự kiện xảy ra trên hệ thống.
- **Main Flow**:
  1. Khi xảy ra các sự kiện (Claim được gửi, Claim được duyệt, Đồ bàn giao thành công, Tìm thấy đồ khớp score cao).
  2. **Observer Pattern** (`Subject.Notify()`) tự động bắt event và ghi bản ghi `Notification` vào DB.
  3. Người dùng nhấn vào biểu tượng Chuông thông báo trên Header để xem danh sách thông báo chưa đọc.
- **Postcondition**: Đánh dấu thông báo đã đọc.

---

### UC11: QUẢN TRỊ VIÊN QUẢN LÝ TÀI KHOẢN & BÀI ĐĂNG (ADMIN MANAGEMENT)
- **Actor**: Admin
- **Precondition**: Đăng nhập tài khoản Admin.
- **Main Flow**:
  1. Admin truy cập Dashboard Quản trị (`/admin`).
  2. Quản lý danh sách người dùng (`/admin/users`): Đổi role (User -> Staff), Khóa/Kích hoạt tài khoản (`BANNED`/`ACTIVE`).
  3. Quản lý bài đăng (`/admin/posts`): Khóa bài đăng vi phạm (`IsLocked`), Xóa bài đăng.
  4. Quản lý danh mục & địa điểm trường học.
- **Postcondition**: Cập nhật thông tin hệ thống ngay lập tức.

---

### UC12: XEM NHẬT KÝ HỆ THỐNG (AUDIT LOGGING)
- **Actor**: Admin
- **Precondition**: Đăng nhập tài khoản Admin.
- **Main Flow**:
  1. Admin truy cập mục Audit Logs (`/admin/audit-logs`).
  2. Xem danh sách lịch sử thao tác quan trọng: Đăng nhập, Duyệt đồ, Khóa tài khoản, Bàn giao đồ.
  3. Lọc lịch sử theo ngày, người thực hiện hoặc loại hành động.
- **Postcondition**: Đảm bảo tính minh bạch và truy vết toàn bộ hoạt động của hệ thống.
