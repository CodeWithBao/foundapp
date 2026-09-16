# 📋 BÁO CÁO NHIỆM VỤ ĐÃ THỰC HIỆN & HƯỚNG DẪN TRIỂN KHAI DỰ ÁN UNIFIND DNTU

---

## 📑 PHẦN 1: TỔNG HỢP NHIỆM VỤ ĐÃ THỰC HIỆN (COMPLETED TASKS)

### 1. Backend (Go / Gin Framework / GORM)
- **Kiến trúc & Router:** Khởi tạo server Go sử dụng Gin Framework với đầy đủ RESTful APIs v1 cho Auth, User, Item, Claim, Matching, Notification, Category, Location, Admin.
- **Cơ sở dữ liệu (Database):** 
  - Tích hợp **GORM** tự động AutoMigrate các schema (`User`, `Category`, `Location`, `Item`, `Claim`, `HandoverRecord`, `Notification`, `AuditLog`, `Match`).
  - Hỗ trợ kết nối **PostgreSQL** qua Docker và SQLite tự động (sử dụng pure-Go driver `github.com/glebarez/go-sqlite` để không phụ thuộc CGO).
  - Tự động Seeding dữ liệu ban đầu cho hệ thống (tài khoản demo, các danh mục đồ thất lạc, địa điểm tòa nhà tại DNTU).
- **Thiết kế Design Patterns:**
  - **Facade Pattern (`ClaimFacade`):** Đóng gói quy trình tạo và xử lý yêu cầu nhận lại đồ phức tạp.
  - **Observer Pattern (`Subject` & `NotificationObserver`):** Tự động phát thông báo theo thời gian thực khi có sự thay đổi trạng thái bài đăng / yêu cầu.
  - **Strategy Pattern (`MatchingStrategy`):** Thuật toán gợi ý đối soát dữ liệu tìm đồ thất lạc dựa trên danh mục, địa điểm và độ tương đồng.
- **Bảo mật & Middleware:** Xác thực Token JWT, mã hóa mật khẩu bcrypt, kiểm tra phân quyền (User, Staff, Admin) và CORS Middleware.

### 2. Frontend (React 19 / Vite / Tailwind CSS)
- **Giao diện người dùng:** Xây dựng đầy đủ các màn hình cho Sinh viên (Trang chủ, Tìm kiếm, Báo mất, Báo nhặt được, Chi tiết đồ, Thẻ sinh viên, Lịch sử yêu cầu), Nhân viên Staff (Duyệt Claim, Bàn giao kho), Quản trị viên Admin (Quản lý User, Bài đăng, Audit Logs, Thống kê).
- **Tối ưu Responsive toàn diện:**
  - Tối ưu hiển thị chuẩn trên mọi thiết bị: Desktop, Laptop, Tablet, Mobile (đặc biệt các dòng iPhone).
  - Cấu hình `viewport-fit=cover`, xử lý safe-area bottom notch cho iPhone (Dynamic Island / Home indicator).
  - Chống phóng to giao diện (zoom focus) ngoài ý muốn trên Safari iOS cho các ô nhập liệu (inputs/selects).
  - Khóa tràn lề ngang (`overflow-x: hidden`) trên toàn bộ thiết bị.

---

## 🚀 PHẦN 2: HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI (DEPLOYMENT GUIDE)

Để mọi người trong nhóm hoặc người dùng khác có thể khởi chạy và sử dụng dự án một cách dễ dàng nhất, có 2 phương pháp triển khai dưới đây:

---

### 🟢 CÁCH 1: KHỞI CHẠY NHANH BẰNG DOCKER (Khuyên dùng - 1 lệnh chạy ngay)

#### Yêu cầu chuẩn bị:
- Đã cài đặt **Docker Desktop** trên máy tính (Windows / macOS / Linux).

#### Các bước thực hiện:
1. Mở Terminal / PowerShell tại thư mục gốc của dự án (`foundapp`).
2. Chạy lệnh khởi động toàn bộ hệ thống (PostgreSQL + Backend Go + Frontend Vite):
   ```bash
   docker compose up -d --build
   ```
3. Truy cập ứng dụng:
   - **Giao diện Web Frontend:** `http://localhost:3000` (hoặc `http://localhost:5173` nếu chạy dev)
   - **API Backend:** `http://localhost:8080/api/health`

---

### 🟡 CÁCH 2: KHỞI CHẠY THỦ CÔNG (Local Development)

#### Yêu cầu môi trường:
- **Node.js:** Phiên bản 18+
- **Go:** Phiên bản 1.22+
- **Docker:** (Để chạy PostgreSQL) hoặc sử dụng SQLite tự động.

#### Bước 1: Khởi động Database & Backend (Go)
1. Khởi động PostgreSQL qua Docker:
   ```bash
   docker compose up -d postgres
   ```
2. Di chuyển vào thư mục backend và tạo file `.env`:
   ```bash
   cd backend
   ```
   *Nội dung file `.env`:*
   ```env
   PORT=8080
   DB_DRIVER=postgres
   DATABASE_URL=postgres://unifind:unifind_password@localhost:5432/unifind_db?sslmode=disable
   JWT_SECRET=super-secret-jwt-key-dntu-2026
   ```
3. Chạy Backend Go:
   ```bash
   go run cmd/server/main.go
   ```
   *(Backend sẽ lắng nghe tại `http://localhost:8080`)*

#### Bước 2: Khởi động Frontend (React + Vite)
1. Mở cửa sổ Terminal thứ 2 tại thư mục gốc dự án (`foundapp`).
2. Cài đặt thư viện dependencies:
   ```bash
   npm install
   ```
3. Khởi chạy giao diện phát triển:
   ```bash
   npm run dev
   ```
4. Truy cập ứng dụng trên trình duyệt: `http://localhost:5173`

---

## 🔑 PHẦN 3: DỮ LIỆU TÀI KHOẢN DÙNG THỬ (DEMO ACCOUNTS)

Hệ thống đã tự động khởi tạo sẵn các tài khoản thử nghiệm tương ứng với từng vai trò:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| **Sinh viên / User** | `user@dntu.edu.vn` | `123456` | Báo mất, báo nhặt, gửi yêu cầu nhận lại đồ, xem thẻ SV |
| **Nhân viên / Staff** | `staff@dntu.edu.vn` | `123456` | Duyệt yêu cầu nhận lại, kiểm kê kho đồ, lập biên bản bàn giao |
| **Quản trị viên / Admin** | `admin@dntu.edu.vn` | `123456` | Quản lý người dùng, bài đăng, nhật ký hệ thống, thống kê |

---

## 📌 PHẦN 4: QUY TRÌNH QUẢN LÝ MÃ NGUỒN (GIT WORKFLOW)

Để đảm bảo an toàn và tính ổn định khi làm việc nhóm:
- **Nhánh làm việc:**
  - `main`: Nhánh sản phẩm ổn định.
  - `develop`: Nhánh tích hợp tính năng.
  - `feature/<ten-tinh-nang>`: Nhánh phát triển tính năng mới.
  - `fix/<ten-loi>`: Nhánh sửa lỗi.
- **Quy chuẩn Commit:** Tuân thủ Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Bảo mật:** Tuyệt đối không commit file `.env`, mật khẩu cá nhân, JWT secret hoặc thông tin nhạy cảm lên Git repository.
