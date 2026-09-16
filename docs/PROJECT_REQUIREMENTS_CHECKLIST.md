# CHECKLIST YÊU CẦU ĐỒ ÁN SOFTWARE ENGINEERING
## DỰ ÁN UNIFIND DNTU - HỆ THỐNG QUẢN LÝ TÀI SẢN THẤT LẠC

Checklist này tổng hợp bằng chứng đáp ứng đầy đủ các tiêu chí đồ án Software Engineering để trình bày trực tiếp với Hội đồng / Giảng viên.

---

| STT | Yêu cầu đồ án (Requirement) | Trạng thái | Bằng chứng kiểm chứng (Evidence & Code Symbols) |
|---|---|---|---|
| **1** | **Mô hình ứng dụng** (Frontend + Backend + Database) | **PASS** | - **Frontend**: React 18, Vite, TailwindCSS (thư mục `src/`)<br>- **Backend**: Go (Gin Framework), GORM (`backend/cmd/server/main.go`)<br>- **Database**: PostgreSQL 16 (`backend/internal/database/database.go`) |
| **2** | **Phân quyền người dùng** (>= 2 Roles) | **PASS** | **3 Roles thực tế** (`models.Role` trong `backend/internal/models/user.go`):<br>1. `USER` (Sinh viên/Người dùng)<br>2. `STAFF` (Cán bộ tiếp nhận & Quản lý đồ thất lạc)<br>3. `ADMIN` (Quản trị hệ thống) |
| **3** | **Số lượng Use Cases** (>= 6-8 Use Cases) | **PASS** | **12 Use Cases hoàn chỉnh** (chi tiết tại `docs/USE_CASES.md`):<br>- UC01: Register / UC02: Login & JWT Auth<br>- UC03: Report Lost Item / UC04: Report Found Item<br>- UC05: Search & Filter / UC06: Matching Suggestions<br>- UC07: Submit Claim / UC08: Staff Review Claim<br>- UC09: Staff Handover Item / UC10: Notification System<br>- UC11: Admin Manage Users & Posts / UC12: Audit Logging |
| **4** | **Kiến trúc phần mềm** (Layered Architecture) | **PASS** | Phân tầng rõ ràng theo chuẩn Software Engineering:<br>`HTTP Handler/Controller` -> `Business Service` -> `Repository` -> `Database`<br>Chi tiết tài liệu tại `docs/ARCHITECTURE.md` |
| **5** | **Áp dụng Design Patterns** (>= 3 Patterns) | **PASS** | **3 Design Patterns thực sự hoạt động trong Business Layer**:<br>1. **Strategy Pattern**: Thuật toán tính điểm khớp đồ thất lạc (`backend/internal/patterns/strategy/matching_strategy.go`)<br>2. **Observer Pattern**: Hệ thống phát & nhận sự kiện thông báo (`backend/internal/patterns/observer/observer.go`)<br>3. **Facade Pattern**: Gom nhóm quy trình Claim & Handover phức tạp (`backend/internal/patterns/facade/claim_facade.go`)<br>Chi tiết tài liệu tại `docs/DESIGN_PATTERNS.md` |
| **6** | **Unit Testing** | **PASS** | Unit tests cho các module cốt lõi (Auth, Item, Matching Strategy, Observer, Claim Facade):<br>- Lệnh chạy test: `go test ./...`<br>- Kết quả: **PASS 100%** |
| **7** | **Triển khai Online Production** | **PASS** | - **Frontend**: Cloudflare Pages (Static SPA dist)<br>- **Backend**: Render Web Service (Go API Docker)<br>- **Database**: Supabase PostgreSQL<br>- **Storage**: Supabase Storage (Base64/URL Data)<br>Chi tiết hướng dẫn tại `DEPLOY_CLOUD.md` |
| **8** | **Triển khai Backup Local + Cloudflare Tunnel** | **PASS** | Khởi chạy 1 cổng duy nhất `8080` qua Nginx Reverse Proxy + Cloudflare Quick Tunnel (`cloudflared tunnel --url http://localhost:8080`) cho phép truy cập từ mọi thiết bị Internet.<br>Chi tiết hướng dẫn tại `DEPLOY_LOCAL.md` |
| **9** | **Quản lý mã nguồn bằng Git** | **PASS** | Tuân thủ quy chuẩn Branching (`main`, `develop`, `feature/*`, `fix/*`) và Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`) |

---

## LỆNH KIỂM THỬ NHANH CHO GIẢNG VIÊN

1. **Chạy Unit Tests**:
   ```bash
   cd backend
   go test ./...
   ```
2. **Build Frontend Production**:
   ```bash
   npm run build
   ```
3. **Khởi chạy Local Production (Docker)**:
   ```powershell
   .\scripts\start-local.ps1
   ```
