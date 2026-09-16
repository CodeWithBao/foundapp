# HƯỚNG DẪN TRIỂN KHAI PRODUCTION LÊN CLOUD
## DỰ ÁN UNIFIND DNTU
(Cloudflare Pages + Render + Supabase PostgreSQL & Storage)

---

## 1. TỔNG QUAN HỆ THỐNG CLOUD PRODUCTION

```
[ Người dùng / Điện thoại ]
           │
           ▼
[ Cloudflare Pages (Frontend React) ]
     (https://unifind-dntu.pages.dev)
           │
           ▼ HTTPS (VITE_API_URL)
[ Render Web Service (Go Backend API) ]
     (https://unifind-api.onrender.com)
           │
     ┌─────┴────────────────────────┐
     ▼                              ▼
[ Supabase PostgreSQL ]    [ Supabase Storage ]
   (DATABASE_URL)             (Bucket: unifind-images)
```

---

## 2. BƯỚC 1: CẤU HÌNH DATABASE & STORAGE TRÊN SUPABASE

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập/đăng ký tài khoản miễn phí.
2. Nhấn **New Project**:
   - Name: `unifind-dntu`
   - Database Password: Nhập mật khẩu mạnh (ví dụ: `UnifindPassword2026!`)
   - Region: Chọn `Singapore` (để có độ trễ thấp nhất về Việt Nam).
3. **Lấy Connection String Database**:
   - Vào **Project Settings** -> **Database** -> Mục **Connection String** -> Chọn tab **URI**.
   - Copy URI có dạng:
     ```text
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
   - Thay `[YOUR-PASSWORD]` bằng mật khẩu bạn đã tạo ở bước 2.
4. **Tạo Storage Bucket (Lưu trữ ảnh)**:
   - Vào mục **Storage** ở menu bên trái -> Nhấn **New Bucket**.
   - Đặt tên bucket: `unifind-images`.
   - Bật tùy chọn **Public Bucket** để cho phép hiển thị ảnh trực tiếp.
5. **Lấy API Keys**:
   - Vào **Project Settings** -> **API**.
   - Copy `Project URL` (ví dụ: `https://xxxx.supabase.co`).
   - Copy `service_role` Secret Key (chỉ dùng cho Backend Render, **tuyệt đối không để lộ ra frontend**).

---

## 3. BƯỚC 2: TRIỂN KHAI BACKEND LÊN RENDER

1. Truy cập [https://render.com](https://render.com) và đăng nhập bằng GitHub.
2. Nhấn **New +** -> Chọn **Web Service**.
3. Kết nối với GitHub Repository của dự án UniFind DNTU:
   - **Name**: `unifind-api`
   - **Region**: `Singapore`
   - **Root Directory**: `backend` (hoặc để trống nếu dùng Dockerfile gốc)
   - **Runtime**: `Go` (hoặc `Docker`)
   - **Build Command**: `go build -o main ./cmd/server`
   - **Start Command**: `./main`
4. **Cấu hình Environment Variables (Environment)**:
   Thêm các biến môi trường sau:
   - `GIN_MODE`: `release`
   - `PORT`: `8080` (hoặc để Render tự cấp)
   - `DATABASE_URL`: `postgresql://postgres:UnifindPassword2026!@db.xxxx.supabase.co:5432/postgres`
   - `JWT_SECRET`: `unifind_dntu_secret_key_cloud_2026_super_secure`
   - `FRONTEND_URL`: `https://unifind-dntu.pages.dev` (sau khi tạo xong Pages sẽ cập nhật chính xác)
   - `SUPABASE_URL`: `https://xxxx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJh...` (Secret key lấy từ Supabase)
   - `SUPABASE_STORAGE_BUCKET`: `unifind-images`
5. Nhấn **Create Web Service**.
6. Chờ Render build và deploy thành công (khoảng 1-2 phút).
7. Kiểm tra endpoint Health:
   - Mở trình duyệt: `https://unifind-api.onrender.com/health`
   - Kết quả trả về: `{"status":"ok"}`.

---

## 4. BƯỚC 3: TRIỂN KHAI FRONTEND LÊN CLOUDFLARE PAGES

1. Truy cập [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Vào mục **Workers & Pages** -> Nhấn **Create Application** -> Chọn tab **Pages** -> **Connect to Git**.
3. Chọn Repository `foundapp` / `unifind-dntu`.
4. Thiết lập thông số Build:
   - **Project name**: `unifind-dntu`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Cấu hình Environment Variables**:
   Thêm biến:
   - `VITE_API_URL`: `https://unifind-api.onrender.com`
6. Nhấn **Save and Deploy**.
7. Sau khi build hoàn tất, Cloudflare Pages sẽ cấp đường link:
   ```text
   https://unifind-dntu.pages.dev
   ```

---

## 5. BƯỚC 4: CẬP NHẬT CORS TRÊN RENDER & KIỂM THỬ TOÀN DIỆN

1. Quay lại trang quản trị Render của backend `unifind-api`.
2. Trong tab **Environment**, cập nhật:
   - `FRONTEND_URL`: `https://unifind-dntu.pages.dev`
3. Render sẽ tự động redeploy với cấu hình CORS mới.
4. Mở trang `https://unifind-dntu.pages.dev` trên máy tính hoặc điện thoại:
   - Đăng nhập với tài khoản: `user@dntu.edu.vn` / `123456`
   - Thử đăng bài báo mất/nhặt được đồ và upload ảnh.
   - Thử chức năng tìm kiếm, nhận đồ, xem thông báo.
   - Hoàn tất triển khai Online 100%!
