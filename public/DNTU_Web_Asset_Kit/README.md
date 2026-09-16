# DNTU Web Asset Kit — CLEAN

Đây là bộ asset mới dành cho web, đã loại bỏ các chi tiết UI bị dính vào ảnh.

## ĐÃ LOẠI BỎ HOÀN TOÀN khỏi campus asset
- icon chuông
- chấm notification
- avatar / chữ TM
- tên nhân viên
- chevron/dropdown
- button
- thành phần header screenshot

## Asset nên dùng

### Header
- `watermarks/dntu-campus-clean.png` — campus sạch, nền trong suốt
- `watermarks/dntu-campus-watermark-burgundy.svg`
- `watermarks/dntu-slogan-burgundy.png`
- `branding/dntu-symbol-burgundy@4x.png`

### Sidebar
- `branding/unifind-dntu-logo-white.svg`
- `watermarks/dntu-campus-lineart-white.svg`
- `watermarks/dntu-slogan-white.png`

## Cách thay bộ cũ

Xóa thư mục cũ:
`public/DNTU_Web_Asset_Kit/`

Sau đó copy thư mục `DNTU_Web_Asset_Kit` trong ZIP này vào:
`public/DNTU_Web_Asset_Kit/`

Các đường dẫn cũ như:
`/DNTU_Web_Asset_Kit/watermarks/dntu-campus-watermark-burgundy.svg`

vẫn được giữ để code hiện tại ít phải sửa, nhưng file bên trong giờ là asset CLEAN.

## Quy tắc web đúng

Asset hình chỉ chứa branding / campus / slogan.

Bell, avatar, user name, menu, badge... phải render bằng component HTML/React riêng.
