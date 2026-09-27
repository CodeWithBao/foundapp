/**
 * Service quản lý lưu trữ và khôi phục vị trí cuộn trang danh sách bài đăng (HomePage, SearchPage, DetailPage).
 * Hỗ trợ khôi phục đúng bài viết vừa mở, bộ lọc, trang phân trang, và tương thích cả nút Back trình duyệt lẫn nút Quay lại web.
 */

const SNAPSHOT_KEY = 'unifind_scroll_snapshot';
const SNAPSHOT_MAX_AGE_MS = 60 * 60 * 1000; // 60 phút

export const scrollRestorationService = {
  /**
   * Lưu snapshot vị trí cuộn và thông tin bài viết được mở
   */
  saveSnapshot({ path, fullPath, scrollY, itemId, cardTop, extra = {} }) {
    try {
      const snapshot = {
        path: path || window.location.pathname,
        fullPath: fullPath || (window.location.pathname + window.location.search),
        scrollY: typeof scrollY === 'number' ? scrollY : (window.scrollY || document.documentElement.scrollTop || 0),
        itemId: itemId ? String(itemId) : null,
        cardTop: typeof cardTop === 'number' ? cardTop : null,
        extra,
        timestamp: Date.now(),
        consumed: false,
      };
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Không thể lưu scroll snapshot:', e);
    }
  },

  /**
   * Lấy snapshot hợp lệ gần nhất (chưa bị tiêu thụ và chưa quá hạn)
   */
  getSnapshot(targetPath) {
    try {
      const raw = sessionStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;
      const snapshot = JSON.parse(raw);
      if (!snapshot || snapshot.consumed) return null;
      if (Date.now() - snapshot.timestamp > SNAPSHOT_MAX_AGE_MS) {
        sessionStorage.removeItem(SNAPSHOT_KEY);
        return null;
      }
      if (targetPath && snapshot.path !== targetPath) {
        return null;
      }
      return snapshot;
    } catch {
      return null;
    }
  },

  /**
   * Lấy snapshot gần nhất mà không cần kiểm tra consumed (dùng cho nút Back tìm đường dẫn trước)
   */
  getLastSnapshot() {
    try {
      const raw = sessionStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Đánh dấu snapshot đã được khôi phục xong để không áp dụng lại khi người dùng lướt tiếp
   */
  consumeSnapshot() {
    try {
      const raw = sessionStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const snapshot = JSON.parse(raw);
        snapshot.consumed = true;
        sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      }
    } catch {
      // ignore
    }
  },

  /**
   * Xóa snapshot khi người dùng chủ động điều hướng sang mục mới
   */
  clearSnapshot() {
    try {
      sessionStorage.removeItem(SNAPSHOT_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Khôi phục vị trí bài viết trên màn hình
   * 1. Tìm element thẻ bài viết theo itemId.
   * 2. Nếu tìm thấy: tính toán khôi phục đúng vị trí hiển thị viewport trước đó (cardTop) hoặc căn giữa, và tạo hiệu ứng nhận diện.
   * 3. Nếu không tìm thấy (bài bị xóa / danh sách thay đổi): khôi phục về scrollY gần nhất.
   */
  restorePosition({ itemId, cardTop, scrollY, maxAttempts = 6, onComplete }) {
    let attempts = 0;

    const tryScroll = () => {
      attempts++;
      const el = itemId ? document.getElementById(`item-card-${itemId}`) : null;

      if (el) {
        if (typeof cardTop === 'number') {
          const rect = el.getBoundingClientRect();
          const currentY = window.scrollY || document.documentElement.scrollTop || 0;
          const targetY = currentY + (rect.top - cardTop);
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' });
        } else {
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
        }

        // Tạo hiệu ứng nhận diện nhẹ nhàng (highlight ring) cho bài vừa xem
        el.classList.add('ring-2', 'ring-[#741216]', 'ring-offset-2', 'shadow-md', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#741216]', 'ring-offset-2', 'shadow-md');
        }, 1800);

        onComplete?.();
        return;
      }

      if (attempts >= maxAttempts) {
        // Fallback vị trí cuộn gần nhất nếu không tìm thấy element cụ thể
        if (typeof scrollY === 'number') {
          window.scrollTo({ top: Math.max(0, scrollY), behavior: 'instant' });
        }
        onComplete?.();
        return;
      }

      // Thử lại ở frame tiếp theo khi DOM sẵn sàng
      setTimeout(tryScroll, 60);
    };

    requestAnimationFrame(tryScroll);
  }
};

export default scrollRestorationService;
