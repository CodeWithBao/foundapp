# THIẾT KẾ MẪU (DESIGN PATTERNS) TRONG UNIFIND DNTU
Tài liệu phân tích 3 Design Patterns cốt lõi được áp dụng trong Backend Layer của dự án UniFind DNTU nhằm đáp ứng tiêu chí Software Engineering.

---

## 1. STRATEGY PATTERN (Mẫu Chiến Lược)

- **Vấn đề (Problem)**: Khi sinh viên báo mất đồ, hệ thống cần tự động quét danh sách đồ nhặt được và tính điểm xem liệu 2 món đồ có phải là một không (Matching). Có nhiều thuật toán/chiến lược tính điểm khác nhau (Ví dụ: Ưu tiên Khớp Danh mục, Ưu tiên Khớp Hình ảnh, Ưu tiên Khớp Text NLP).
- **Lý do lựa chọn**: Strategy cho phép linh hoạt đổi mới hoặc bổ sung thuật toán tính Match Score mà không cần sửa đổi lõi Service của chức năng Báo mất/Báo nhặt.
- **Vị trí cài đặt**: `backend/internal/patterns/strategy/matching_strategy.go`
- **Các thành phần (Participants)**:
  - `MatchingStrategy` (Interface): Định nghĩa hàm `CalculateScore(lostItem, foundItem) float64`.
  - `CategoryLocationMatchingStrategy` (Concrete Strategy): Thuật toán tính điểm đơn giản dựa trên độ trùng khớp của Danh mục, Địa điểm, Từ khóa và Khoảng cách thời gian.
  - `MatchingContext`: Context lưu trữ strategy hiện tại và gọi `Match()`.
- **Luồng chạy thực tế (Runtime flow)**:
  1. User gọi API Report Lost Item (`POST /items`).
  2. `ItemService.CreateItem` gọi ngầm goroutine `runMatching(item)`.
  3. Context được khởi tạo: `strategy.NewMatchingContext(&strategy.CategoryLocationMatchingStrategy{})`.
  4. Duyệt danh sách các món đồ opposite type và gọi `context.Match(lost, found)`.
  5. Nếu `Score >= 40.0`, lưu bản ghi Match vào Database.
- **Use case liên quan**: UC06 (Matching Suggestions).

---

## 2. OBSERVER PATTERN (Mẫu Quan Sát)

- **Vấn đề (Problem)**: Khi một Yêu cầu nhận đồ (Claim) mới được tạo, hoặc trạng thái của Claim bị thay đổi (Từ chối, Duyệt), hệ thống cần thông báo cho Chủ đồ, Người nhặt, hoặc Cán bộ. Nếu viết trực tiếp mã gửi thông báo vào ClaimService, module ClaimService sẽ bị "dính chặt" (tight coupling) với NotificationService.
- **Lý do lựa chọn**: Observer cho phép tách biệt module tạo sự kiện (Subject) ra khỏi module xử lý sự kiện (Observer). Khi cần thêm kênh thông báo (ví dụ gửi Email, gửi Zalo, gửi Push Notification), chỉ cần tạo thêm Observer mới thay vì sửa mã cũ.
- **Vị trí cài đặt**: `backend/internal/patterns/observer/observer.go`
- **Các thành phần (Participants)**:
  - `Event` (Struct): Chứa data như Type, UserID, Title, Message, RelatedID.
  - `Observer` (Interface): Có hàm `OnNotify(event Event)`.
  - `Subject` (Struct): Lưu danh sách Observer và có hàm `Register(obs)`, `Notify(event)`.
  - `NotificationObserver` (Concrete Observer): Lắng nghe event và ghi `Notification` vào Database GORM.
- **Luồng chạy thực tế (Runtime flow)**:
  1. Trong `main.go`, khởi tạo `notifier := &observer.Subject{}`.
  2. Đăng ký `notifObserver := observer.NewNotificationObserver(db)`.
  3. Truyền `notifier` vào cho `ClaimFacade`.
  4. Khi `ClaimFacade.SubmitClaim()` chạy thành công, gọi `cf.notifier.Notify(Event{...})`.
  5. NotificationObserver bắt sự kiện và lưu vào DB. Sinh viên thấy thông báo ở chuông Header.
- **Use case liên quan**: UC10 (Notification System).

---

## 3. FACADE PATTERN (Mẫu Mặt Tiền)

- **Vấn đề (Problem)**: Quy trình gửi, kiểm duyệt và bàn giao đồ thất lạc (Claim Workflow) rất phức tạp. Khi Staff bàn giao đồ, hệ thống phải làm 4 việc:
  1. Kiểm tra trạng thái hiện tại của Claim.
  2. Cập nhật trạng thái Claim sang `RETURNED`.
  3. Cập nhật trạng thái Item sang `RETURNED`.
  4. Ghi một bản ghi HandoverRecord.
  5. Phát tín hiệu Notification cho sinh viên.
  Nếu bắt HTTP Handler (Controller) phải gọi tất cả các service này rời rạc, Handler sẽ phình to và lặp mã.
- **Lý do lựa chọn**: Facade gom toàn bộ logic quy trình nội bộ phức tạp vào một interface/struct duy nhất, cung cấp cho HTTP Handler một API đơn giản gọn gàng như `Handover(...)`.
- **Vị trí cài đặt**: `backend/internal/patterns/facade/claim_facade.go`
- **Các thành phần (Participants)**:
  - `ClaimFacade` (Facade class): Nắm giữ DB connection và Notifier Subject.
  - Cung cấp các high-level methods: `SubmitClaim`, `ReviewClaim`, `ApproveClaim`, `Handover`.
  - Bên trong Facade giấu đi các quy tắc kinh doanh phức tạp (`BR03`, `BR04`, `BR05`).
- **Luồng chạy thực tế (Runtime flow)**:
  1. Router `/api/v1/claims/:id/handover` gọi tới `ClaimHandler.Handover`.
  2. Handler parse JSON body (tên người nhận, mssv...) và gọi `cf.facade.Handover(...)`.
  3. `ClaimFacade` tự động thực thi Transaction (nếu cần), tạo Record, đổi trạng thái Item, và tự trigger Observer Notify.
  4. Trả về kết quả trực tiếp cho Handler.
- **Use case liên quan**: UC07, UC08, UC09 (Submit Claim, Review Claim, Staff Handover).
