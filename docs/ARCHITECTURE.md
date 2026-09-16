# KIẾN TRÚC PHÂN TẦNG (LAYERED ARCHITECTURE) - UNIFIND DNTU

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống UniFind DNTU được xây dựng tuân thủ chặt chẽ mô hình **Kiến trúc Phân Tầng (Layered Architecture)** tiêu chuẩn trong Kỹ thuật phần mềm (Software Engineering).

```
   ┌────────────────────────────────────────────────────────┐
   │                  PRESENTATION LAYER                    │
   │   - React 18 SPA (Vite, TailwindCSS, React Router 6)   │
   │   - Quản lý State: AuthContext, UI Components          │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP / REST API (JSON)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  CONTROLLER LAYER                      │
   │   - Gin HTTP Handlers (backend/internal/*/handler.go)  │
   │   - Routing, JWT Auth Middleware, Request Binding/DTO  │
   └───────────────────────────┬────────────────────────────┘
                               │ DTO & Pure Function Calls
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │               SERVICE / BUSINESS LOGIC LAYER           │
   │   - Business Services (backend/internal/*/service.go)  │
   │   - Design Patterns:                                   │
   │     * Strategy (Matching Algorithm)                    │
   │     * Observer (Event Notifications)                   │
   │     * Facade (Complex Claim & Handover Workflows)      │
   └───────────────────────────┬────────────────────────────┘
                               │ Interfaces / GORM Entities
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                   REPOSITORY LAYER                     │
   │   - Repositories (backend/internal/*/repository.go)    │
   │   - Data Access Object (DAO), GORM Queries             │
   └───────────────────────────┬────────────────────────────┘
                               │ SQL Queries / TCP Connection
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                   DATABASE / STORAGE                   │
   │   - PostgreSQL 16 (Local & Supabase Cloud)             │
   │   - Storage: Base64 / Supabase Storage                 │
   └────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT CÁC TẦNG TRONG SOURCE CODE

### 1. Presentation Layer (Giao diện người dùng)
- Thư mục: `src/`
- Chịu trách nhiệm: Hiển thị giao diện, điều hướng trang (SPA), bắt sự kiện người dùng và gọi API qua `apiClient.js`.
- Không chứa logic nghiệp vụ cốt lõi hay truy cập trực tiếp database.

### 2. Controller Layer (HTTP Handlers)
- Thư mục: `backend/internal/auth`, `backend/internal/item`, `backend/internal/claim`, `backend/internal/admin`... (file `handler.go`)
- Chịu trách nhiệm: Tiếp nhận HTTP request, parse body thành struct DTO, gọi xuống tầng Service hoặc Facade, trả về mã trạng thái HTTP (200, 201, 400, 404, 500) và JSON response.

### 3. Business Service Layer (Tầng nghiệp vụ & Design Patterns)
- Thư mục: `backend/internal/*/service.go` và `backend/internal/patterns/`
- Chịu trách nhiệm: Thực thi toàn bộ quy tắc nghiệp vụ (Business Rules - BR):
  - BR01/BR02: Mã hóa mật khẩu, kiểm tra trạng thái hoạt động tài khoản.
  - BR03: Không cho phép tự Claim đồ của chính mình.
  - BR04: Không Claim đồ đã đóng hoặc đã trả.
  - BR05: Không tạo 2 Claim trùng lặp cho cùng 1 vật phẩm.
  - Tích hợp 3 Design Patterns: Strategy, Observer, Facade.

### 4. Repository Layer (Tầng truy xuất dữ liệu)
- Thư mục: `backend/internal/*/repository.go`
- Chịu trách nhiệm: Đóng gói các câu lệnh truy vấn GORM (`Create`, `FindByID`, `FindAll`, `Update`, `Delete`), phân trang (Pagination), lọc điều kiện (Filter).
- Các Service chỉ giao tiếp với Repository thông qua Go Interface, giúp dễ dàng Mock khi viết Unit Test.

### 5. Database Layer (Cơ sở dữ liệu)
- PostgreSQL 16 (Hỗ trợ cả Local Docker container và Cloud Supabase thông qua biến môi trường `DATABASE_URL`).
- Tự động Migrate các bảng thực thể (`AutoMigrate`) và nạp dữ liệu mẫu ban đầu (`SeedData`).
