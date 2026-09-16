# UniFind DNTU - Hệ thống Quản lý Tài sản Thất lạc

Hệ thống quản lý, tìm kiếm và hoàn trả tài sản thất lạc dành cho Trường Đại học Công nghệ Đồng Nai (DNTU).

## 🚀 Giới thiệu & Tech Stack

UniFind DNTU kết nối sinh viên, giảng viên và bộ phận quản lý tài sản thất lạc tại khuôn viên trường. Ứng dụng mô phỏng quy trình tiếp nhận, đối soát, xác minh quyền sở hữu và bàn giao đồ thất lạc minh bạch và bảo mật.

- **Frontend Core:** React 19, Vite
- **Styling:** Tailwind CSS v3
- **Icons & UI Feedback:** Lucide React, Sonner (Toast notifications)
- **Data Visualization:** Recharts
- **State & Data Layer:** React Context, LocalStorage mock backend service với dữ liệu khởi tạo phong phú (Users, Items, Categories, Locations, Claims, Handover Records, Audit Logs).

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu môi trường:
- Node.js (phiên bản 18+ khuyến nghị)
- npm hoặc yarn/pnpm

### Các bước thực hiện:

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển (Development)
npm run dev

# 3. Đóng gói ứng dụng cho production (Build test)
npm run build

# 4. Xem trước bản build production
npm run preview
```

Ứng dụng mặc định chạy tại `http://localhost:5173`.

---

## 🔑 Tài khoản Demo (Demo Accounts)

Hệ thống hỗ trợ cơ chế đăng nhập nhanh hoặc nhập thông tin thủ công:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Sinh viên / Người dùng** | `user@dntu.edu.vn` | `123456` | Đại diện sinh viên DNTU |
| **Nhân viên tiếp nhận (Staff)** | `staff@dntu.edu.vn` | `123456` | Phòng Công tác Sinh viên / Bảo vệ |
| **Quản trị viên (Admin)** | `admin@dntu.edu.vn` | `123456` | Ban Quản trị hệ thống DNTU |

---

## 👥 Phân quyền & Tính năng chính theo vai trò

### 1. Sinh viên / Người dùng (User / Student)
- **Báo mất tài sản (Report Lost):** Khai báo thông tin tài sản bị mất (danh mục, địa điểm tại DNTU, ngày giờ, mô tả, hình ảnh).
- **Báo nhặt được tài sản (Report Found):** Khai báo đồ nhặt được để giao nộp hoặc hỗ trợ tìm chủ nhân.
- **Tìm kiếm & Bộ lọc:** Tìm kiếm đồ thất lạc theo tên, danh mục, tòa nhà, trạng thái, thời gian.
- **Gợi ý khớp tự động (Matching):** Thuật toán gợi ý đối soát tự động giữa tin báo mất và tin nhặt được dựa trên danh mục, địa điểm và từ khóa.
- **Gửi yêu cầu nhận lại (Claim):** Cung cấp bằng chứng sở hữu (đặc điểm nhận dạng, hình ảnh hóa đơn/ảnh chụp trước đó, câu hỏi bảo mật).
- **Theo dõi tiến độ & Thông báo:** Theo dõi trạng thái duyệt yêu cầu và nhận thông báo theo thời gian thực.

### 2. Nhân viên tiếp nhận & Xử lý (Staff)
- **Tổng quan quản lý (Staff Dashboard):** Thống kê nhanh các đồ nhặt được mới tiếp nhận, yêu cầu nhận lại đang chờ duyệt, đồ đã bàn giao.
- **Quản lý kho tài sản (Item Management):** Tiếp nhận, kiểm kê mã lưu kho, cập nhật trạng thái (chờ xác minh, đang lưu kho, đã trả lại).
- **Xác minh & Duyệt yêu cầu nhận lại (Claims Approval):** Kiểm tra đối chiếu chứng cứ sở hữu của người yêu cầu; phê duyệt hoặc từ chối kèm lý do.
- **Lập biên bản bàn giao (Handover Record):** Tạo và in/lưu biên bản bàn giao chính thức khi người nhận đến nhận lại đồ tại văn phòng.

### 3. Quản trị viên (Admin)
- **Bảng điều khiển quản trị (Admin Dashboard & Analytics):** Biểu đồ thống kê theo danh mục, vị trí rơi đồ phổ biến, tỷ lệ hoàn trả thành công (sử dụng Recharts).
- **Quản lý danh mục & Vị trí:** Thêm, sửa, kích hoạt/vô hiệu hóa các danh mục đồ dùng và danh sách các tòa nhà/khu vực tại DNTU.
- **Quản lý người dùng:** Phân quyền vai trò (User, Staff, Admin), khóa/mở khóa tài khoản người dùng.
- **Quản lý bài đăng:** Giám sát, gỡ bỏ hoặc kiểm duyệt các bài đăng vi phạm quy chế.
- **Nhật ký hệ thống (Audit Logs):** Theo dõi toàn bộ lịch sử thao tác của nhân viên và quản trị viên nhằm đảm bảo tính minh bạch.
- **Cấu hình hệ thống:** Tùy chỉnh thông tin liên hệ, thời hạn lưu trữ đồ thất lạc và quy định hoàn trả.
