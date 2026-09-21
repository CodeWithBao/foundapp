# Smart Matching & Cú DNTU

## Luồng hoạt động

1. Người dùng gửi báo mất hoặc báo nhặt được kèm ảnh và nội dung.
2. Frontend thu ảnh về ma trận xám `8x8` và tạo dấu vân tay ảnh 64 bit.
3. Backend so sánh món mới với các món khác loại đang còn hiệu lực.
4. Kết quả từ 35 điểm trở lên được lưu thành ứng viên và tạo thông báo cho chủ bài báo mất.
5. Cú DNTU kiểm tra thông báo định kỳ, tự mở khi có kết quả mới và dẫn người dùng đến `/matches`.
6. Người dùng xem danh sách, ảnh, vị trí nhặt được, lý do và bảng điểm; việc bàn giao chỉ tiếp tục sau bước xác minh.

## Công thức điểm (100 điểm)

| Nhóm | Điểm tối đa |
| --- | ---: |
| Danh mục | 20 |
| Nội dung tiếng Việt | 25 |
| Dấu vân tay ảnh | 25 |
| Khu vực | 10 |
| Thời gian | 10 |
| Màu sắc | 5 |
| Thương hiệu | 5 |

Điểm số là gợi ý, không phải kết luận quyền sở hữu. Vị trí bảo quản chi tiết và thông tin liên hệ không được mở chỉ dựa trên điểm số.

## Chống kết quả rác và thông báo lặp

- Chỉ đối chiếu `LOST` đang hoạt động với `FOUND` đang hoạt động.
- Bỏ qua bài bị khóa hoặc ẩn.
- Mỗi cặp `lost_item_id + found_item_id` chỉ tạo thông báo ở lần đầu; lần quét sau chỉ cập nhật điểm.
- API `/matches/item/:id` yêu cầu đăng nhập.

## Kiểm thử nhanh

```bash
npm run build
cd backend
go test ./...
```

Kịch bản nghiệm thu: tạo một bài báo mất và một bài báo nhặt có cùng ảnh/mô tả, kiểm tra thông báo `ITEM_MATCHED`, mở Cú DNTU, vào danh sách đối chiếu và gửi yêu cầu xác minh.
