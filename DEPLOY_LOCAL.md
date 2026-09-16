# HƯỚNG DẪN TRIỂN KHAI LOCAL PRODUCTION & CLOUDFLARE TUNNEL
## DỰ ÁN UNIFIND DNTU - HỆ THỐNG QUẢN LÝ TÀI SẢN THẤT LẠC

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI (SINGLE-PORT ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **Local Production** khép kín với kiến trúc **Reverse Proxy 1 Cổng duy nhất**:

```
[ Internet / Mobile / Laptop ]
              │
              ▼
   [ Cloudflare Tunnel ] (Tùy chọn expose ra ngoài)
              │
              ▼
    http://localhost:8080
              │
  ┌───────────▼────────────────────────────────────────────┐
  │  Nginx Reverse Proxy Container (Port 8080:80)           │
  │  - Phục vụ Static Frontend (React SPA dist)            │
  │  - SPA Fallback Routing: try_files $uri /index.html    │
  │  - Uploads: client_max_body_size 25M                   │
  └───────────┬────────────────────────────────────────────┘
              │ Proxy /api/* (Internal Docker Network)
              ▼
  ┌────────────────────────────────────────────────────────┐
  │  Go Gin Backend Container (Port 8080 nội bộ)          │
  │  - REST API v1 (/api/v1/*)                             │
  │  - Business logic, JWT Authentication, CORS            │
  └───────────┬────────────────────────────────────────────┘
              │ GORM / TCP 5432 (Internal Docker Network)
              ▼
  ┌────────────────────────────────────────────────────────┐
  │  PostgreSQL 16 Database Container (Port 5432 nội bộ)   │
  │  - Persistent Volume: pgdata                          │
  │  - Tự động AutoMigrate & Seed dữ liệu mẫu ban đầu      │
  └────────────────────────────────────────────────────────┘
```

### Các ưu điểm kỹ thuật:
1. **Không xung đột port & Bảo mật cao**: Chỉ duy nhất port `8080` được expose ra máy host. Backend Go và Database PostgreSQL chạy hoàn toàn trong mạng nội bộ của Docker.
2. **Same-Origin API (`/api/v1`)**: Frontend không hardcode `http://localhost:8080`, sử dụng relative path `/api/v1`. Khi truy cập qua Cloudflare Tunnel (`https://*.trycloudflare.com`), toàn bộ request API tự động đi cùng domain, không bao giờ bị lỗi CORS hay Mixed Content.
3. **Bảo toàn dữ liệu**: Database được mount vào named volume `pgdata`, bảo đảm dữ liệu tin đăng, tài khoản và lịch sử trả đồ không bị mất khi restart container.
4. **Không phụ thuộc lưu file local**: Hình ảnh được mã hóa dạng Base64 Data URL lưu trực tiếp trong DB (`models.ItemImage.ImageURL`), hiển thị tức thì trên mọi thiết bị và domain mà không cần cấu hình mount thư mục static file.

---

## 2. YÊU CẦU MÔI TRƯỜNG

- **Hệ điều hành**: Windows 10/11 (hoặc macOS / Ubuntu Linux)
- **Docker Desktop**: Phiên bản 4.x trở lên (đã kích hoạt WSL 2 trên Windows)
- **Cloudflare Tunnel (cloudflared)** (để public ra Internet):
  - Tải file thực thi `cloudflared-windows-amd64.exe` từ [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases)
  - Đổi tên thành `cloudflared.exe` và copy vào thư mục `C:\Windows\System32` (hoặc thêm vào PATH hệ thống).
  - Hoặc cài nhanh bằng Winget:
    ```powershell
    winget install --id Cloudflare.cloudflared
    ```

---

## 3. CÁC BƯỚC KHỞI CHẠY HỆ THỐNG

### Cách 1: Sử dụng PowerShell Scripts (Khuyên dùng trên Windows)

1. Mở PowerShell tại thư mục gốc dự án:
   ```powershell
   .\scripts\start-local.ps1
   ```
2. Để xem log thời gian thực:
   ```powershell
   .\scripts\logs-local.ps1
   ```
3. Để dừng toàn bộ hệ thống:
   ```powershell
   .\scripts\stop-local.ps1
   ```

### Cách 2: Sử dụng lệnh Docker Compose tiêu chuẩn

1. **Khởi động và build toàn bộ containers**:
   ```bash
   docker compose up -d --build
   ```
2. **Kiểm tra trạng thái containers**:
   ```bash
   docker compose ps
   ```
   *Kết quả kỳ vọng: Cả 3 containers `unifind_postgres`, `unifind_backend`, `unifind_frontend` đều ở trạng thái `Up / healthy`.*

3. **Truy cập ứng dụng cục bộ**:
   - Trình duyệt web: [http://localhost:8080](http://localhost:8080)
   - Kiểm tra API Backend: [http://localhost:8080/api/v1/categories](http://localhost:8080/api/v1/categories)

---

## 4. PUBLIC RA INTERNET BẰNG CLOUDFLARE TUNNEL

Sau khi các container Docker đang chạy và truy cập được qua `http://localhost:8080`:

1. Mở một cửa sổ PowerShell hoặc Command Prompt mới.
2. Chạy lệnh tạo tunnel nhanh (Quick Tunnel không cần tài khoản Cloudflare):
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
3. Cloudflare sẽ tạo một đường link public có định dạng:
   ```text
   https://xxxx-xxxx-xxxx.trycloudflare.com
   ```
4. **Chia sẻ đường link này**:
   - Bạn bè, thầy cô hoặc người dùng trên điện thoại (iPhone, Android) có thể truy cập trực tiếp từ mạng 4G/5G hoặc ngoài trường học.
   - Giao diện tự động tối ưu hóa hiển thị responsive mobile (chuẩn tai thỏ iPhone, bottom navigation bar, form chụp ảnh camera).
   - Đăng nhập, gửi tin báo mất/nhặt được, duyệt nhận đồ đều hoạt động trơn tru 100%.

---

## 5. TÀI KHOẢN MẪU ĐỂ KIỂM THỬ (DEMO ACCOUNTS)

Hệ thống đã tự động nạp sẵn dữ liệu ban đầu vào database:

| Phân quyền | Email đăng nhập | Mật khẩu | Chức năng kiểm thử chính |
| :--- | :--- | :--- | :--- |
| **Sinh viên / User** | `user@dntu.edu.vn` | `password` | Báo mất đồ, báo nhặt đồ, tra cứu danh sách, gửi yêu cầu nhận lại đồ |
| **Cán bộ tiếp nhận / Staff** | `staff@dntu.edu.vn` | `password` | Tiếp nhận đồ, duyệt yêu cầu Claim, tạo biên bản bàn giao |
| **Quản trị viên / Admin** | `admin@dntu.edu.vn` | `password` | Quản trị tài khoản, kiểm duyệt tin đăng, xem Audit Log hệ thống |

---

## 6. SAO LƯU & PHỤC HỒI DỮ LIỆU (BACKUP & RESTORE POSTGRES)

Toàn bộ dữ liệu được lưu trong Docker volume `pgdata`. Bạn có thể sao lưu ra file `.sql` bất kỳ lúc nào:

### Sao lưu (Backup):
```powershell
docker exec -t unifind_postgres pg_dump -U unifind unifind_db > backup_unifind_$(Get-Date -Format "yyyyMMdd_HHmm").sql
```

### Phục hồi (Restore):
```powershell
# Chép file sql vào container và import lại
cat backup_unifind.sql | docker exec -i unifind_postgres psql -U unifind -d unifind_db
```

---

## 7. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### 1. Kẹt port 8080 trên Windows máy host
- **Hiện tượng**: Docker báo lỗi `bind: address already in use` hoặc không start được `unifind_frontend`.
- **Cách xử lý**:
  ```powershell
  # Tìm process đang giữ port 8080
  netstat -ano | findstr :8080
  # Tắt process (thay <PID> bằng số tiến trình hiển thị ở cột cuối)
  taskkill /PID <PID> /F
  # Sau đó chạy lại: docker compose up -d
  ```

### 2. Trang web hiện giao diện nhưng báo lỗi Network Error hoặc không tải được dữ liệu
- **Nguyên nhân**: Backend hoặc Postgres chưa khởi động xong.
- **Cách xử lý**:
  ```powershell
  # Kiểm tra logs của backend
  docker logs unifind_backend
  # Đảm bảo postgres đã healthy:
  docker inspect --format='{{json .State.Health.Status}}' unifind_postgres
  ```

### 3. F5 / Reload trang con (ví dụ /search, /report-lost) bị lỗi 404 Not Found
- **Nguyên nhân**: Nginx chưa cấu hình fallback React Router.
- **Cách xử lý**: Nginx đã được cấu hình chỉ thị `try_files $uri $uri/ /index.html;` trong file `nginx.conf`. Nếu gặp lỗi này, kiểm tra file `nginx.conf` và build lại container frontend:
  ```powershell
  docker compose build --no-cache frontend
  docker compose up -d frontend
  ```

### 4. Upload ảnh báo lỗi `413 Request Entity Too Large`
- **Nguyên nhân**: Nginx chặn kích thước payload ảnh Base64 vượt quá 1MB mặc định.
- **Khắc phục**: Đã cấu hình `client_max_body_size 25M;` trong `nginx.conf` cho phép tải ảnh độ phân giải cao từ camera iPhone và laptop.

---

## 8. CHUYỂN ĐỔI GIỮA LOCAL DEV VÀ LOCAL PRODUCTION

- **Chạy Local Dev (Hỗ trợ Hot-reload khi sửa code)**:
  - Khởi động riêng Postgres: `docker compose up -d postgres`
  - Chạy Backend Go: Mở thư mục `backend` và chạy `go run cmd/server/main.go`
  - Chạy Frontend React: Chạy `npm run dev` (truy cập `http://localhost:5173`)
  *(File `vite.config.js` đã được tích hợp proxy `/api` tự động chuyển tiếp tới `http://localhost:8080`)*

- **Chạy Local Production (Đóng gói cho mọi người truy cập qua Cloudflare)**:
  - Tắt các tiến trình dev cục bộ
  - Chạy `.\scripts\start-local.ps1` hoặc `docker compose up -d --build`
  - Mở tunnel: `cloudflared tunnel --url http://localhost:8080`
