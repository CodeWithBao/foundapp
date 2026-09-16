# HƯỚNG DẪN TRIỂN KHAI PRODUCTION ONLINE - UNIFIND DNTU

Tài liệu này hướng dẫn chi tiết quy trình triển khai hệ thống **UniFind DNTU** lên môi trường Internet công khai (Zero Cost / Free Tier) để giảng viên và sinh viên có thể truy cập qua trình duyệt.

---

## 🏗️ 1. KIẾN TRÚC TRIỂN KHAI ONLINE

```
                  ┌─────────────────────────────────┐
                  │    Trình duyệt Sinh viên / BGH   │
                  └────────────────┬────────────────┘
                                   │ HTTPS
                                   ▼
                  ┌─────────────────────────────────┐
                  │   Cloudflare Pages (Frontend)   │
                  │   https://unifind-dntu.pages.dev│
                  └────────────────┬────────────────┘
                                   │ HTTPS REST API (/api/v1)
                                   ▼
                  ┌─────────────────────────────────┐
                  │       Render (Go Backend)       │
                  │  https://unifind-api.onrender.com
                  └────────┬───────────────┬────────┘
                           │               │
            SQL Database   │               │ File Storage
                           ▼               ▼
          ┌───────────────────┐   ┌───────────────────┐
          │Supabase PostgreSQL│   │ Supabase Storage  │
          └───────────────────┘   └───────────────────┘
```

---

## 🗄️ 2. BƯỚC 1: KHỞI TẠO DATABASE VÀ STORAGE TRÊN SUPABASE

1. Truy cập [https://supabase.com](https://supabase.com) và tạo một tài khoản miễn phí.
2. Nhấn **New project**:
   - **Name**: `unifind-dntu`
   - **Database Password**: Lưu mật khẩu bảo mật này lại.
   - **Region**: `Singapore (ap-southeast-1)` (để tối ưu độ trễ cho Việt Nam).
3. **Lấy Connection String PostgreSQL**:
   - Vào **Project Settings** -> **Database** -> **Connection string** -> **URI**.
   - Copy chuỗi kết nối dạng:
     `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
4. **Tạo Storage Bucket cho ảnh vật phẩm**:
   - Vào mục **Storage** trên menu bên trái -> Nhấn **New Bucket**.
   - Đặt tên bucket: `unifind-media`.
   - Bật chế độ: **Public Bucket** (để ảnh có thể hiển thị trực tiếp trên trình duyệt).
5. **Lấy API Keys**:
   - Vào **Project Settings** -> **API**.
   - Copy **Project URL** (`https://[PROJECT-REF].supabase.co`).
   - Copy **service_role secret key** (Lưu ý: Chỉ cấu hình ở Backend, TUYỆT ĐỐI KHÔNG đưa vào Frontend).

---

## 🚀 3. BƯỚC 2: DEPLOY GO BACKEND LÊN RENDER

1. Push mã nguồn dự án lên GitHub Repository của bạn.
2. Truy cập [https://render.com](https://render.com) và đăng nhập bằng tài khoản GitHub.
3. Chọn **New +** -> **Web Service** -> Chọn Repository chứa dự án `foundapp`.
4. Điền các thông số cấu hình:
   - **Name**: `unifind-dntu-backend`
   - **Language**: `Go`
   - **Root Directory**: `backend`
   - **Build Command**: `go build -o server ./cmd/server`
   - **Start Command**: `./server`
5. Thiết lập **Environment Variables** trong tab **Environment**:
   ```env
   APP_ENV=production
   PORT=8080
   GIN_MODE=release
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
   ALLOWED_ORIGINS=https://unifind-dntu.pages.dev,http://localhost:5173
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_STORAGE_BUCKET=unifind-media
   ADMIN_EMAIL=admin@dntu.edu.vn
   ADMIN_PASSWORD=AdminSecurePassword2026!
   ADMIN_NAME=Super Admin
   ```
6. Nhấn **Create Web Service**. Khi build hoàn tất, kiểm tra endpoint sức khỏe:
   `https://<your-render-app-name>.onrender.com/health` -> Nhận JSON `{"status": "ok"}`.

---

## 🌐 4. BƯỚC 3: DEPLOY REACT FRONTEND LÊN CLOUDFLARE PAGES

1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Create application** -> Tab **Pages** -> **Connect to Git**.
2. Chọn repository dự án.
3. Thiết lập thông số Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (để trống hoặc nhập `./`)
4. Thiết lập **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://<your-render-app-name>.onrender.com`
5. Nhấn **Save and Deploy**.
6. Cloudflare sẽ cấp URL dạng: `https://unifind-dntu.pages.dev`.

---

## 🔒 5. BƯỚC 4: ĐỒNG BỘ CORS BACKEND

1. Quay lại trang **Render** -> Dashboard của Backend Service -> Mục **Environment**.
2. Cập nhật biến `ALLOWED_ORIGINS` chính xác bằng tên miền Cloudflare Pages vừa nhận được:
   `ALLOWED_ORIGINS=https://unifind-dntu.pages.dev`
3. Nhấn **Save Changes** để Render tự động redeploy backend.

---

## 🧪 6. QUY TRÌNH KIỂM THỬ NGHIỆM THU TRỰC TUYẾN (ACCEPTANCE TEST)

### Test Case 1: Đăng ký & Báo mất đồ (User 1 - Sinh viên A)
1. Mở `https://unifind-dntu.pages.dev` trên tab ẩn danh.
2. Đăng ký tài khoản: `sinhvien_a@dntu.edu.vn` (Mật khẩu: `123456`).
3. Đăng nhập -> Vào mục **Báo Mất Đồ** -> Nhập thông tin + Upload ảnh thẻ/ví.
4. Kiểm tra bài đăng xuất hiện trong **Bài đăng của tôi**.

### Test Case 2: Báo nhặt được đồ & Matching (User 2 - Sinh viên B)
1. Mở một trình duyệt khác hoặc điện thoại -> Đăng ký: `sinhvien_b@dntu.edu.vn`.
2. Đăng nhập -> Vào mục **Báo Nhặt Được Đồ** -> Nhập thông tin cùng danh mục & địa điểm gần vị trí User 1.
3. User 1 vào mục **Gợi ý khớp (Matching)** -> Xem điểm số % tương đồng do thuật toán Strategy Pattern tính toán tự động.

### Test Case 3: Gửi Claim & Staff Xét Duyệt & Bàn Giao
1. User 1 nhấn **Nhận lại món đồ này** (Submit Claim) -> Điền thông tin chứng minh.
2. Đăng nhập tài khoản Staff (`staff@dntu.edu.vn` / `staff123` hoặc tài khoản Staff do Admin chỉ định).
3. Staff vào **Quản lý Yêu cầu Claim** -> Xem xét bằng chứng -> Nhấn **Chấp thuận (Approve)**.
4. Staff tiến hành **Bàn giao vật phẩm** -> Nhập mã sinh viên và ký nhận -> Trạng thái chuyển thành `COMPLETED` và `RETURNED`.
5. User 1 nhận được chuông thông báo (Notification) qua Observer Pattern.

---

## 🛡️ 7. KHÔI PHỤC VÀ SAO LƯU DỰ PHÒNG (BACKUP & RESTORE)

- **Supabase PostgreSQL**: Hỗ trợ tự động Daily Backup và Point-in-time Recovery trên giao diện web.
- **Local Fallback**: Nếu mạng trường mất kết nối Internet, chạy ngay bản Local Production qua 1 dòng lệnh:
  ```powershell
  ./scripts/start-local.ps1
  ```
  Và tạo link truy cập qua Cloudflare Quick Tunnel:
  ```powershell
  cloudflared tunnel --url http://localhost:8080
  ```
