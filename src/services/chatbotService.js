import { apiFetch } from './apiClient';
import itemService from './itemService';

// ==============================================================
// BỘ LỌC GUARDRAIL CHỐNG NỘI DUNG NGOÀI LUỒNG & YÊU CẦU CODE
// ==============================================================
const CODE_PATTERNS = [
  /(viết|cho|lấy|xem|đưa|hướng\s*dẫn)\s+(code|mã\s*nguồn|mã\s*lệnh|script|function|hàm|source\s*code)/i,
  /(code\s+(python|javascript|golang|go|c\+\+|java|php|html|css|sql|rust|bash|sh|powershell|c#))/i,
  /(lập\s*trình|thuật\s*toán|debug|fix\s*bug|cú\s*pháp|syntax\s*error|compile|run\s*code)/i,
  /(database\s*schema|lược\s*đồ\s*bảng|cơ\s*sở\s*dữ\s*liệu|select\s+\*\s+from|insert\s+into|drop\s+table)/i,
  /(api\s*key|jwt\s*secret|token\s*bảo\s*mật|mật\s*khẩu\s*db|env\s*file|dockerfile)/i,
];

const JAILBREAK_PATTERNS = [
  /(ignore\s+(all\s+)?(previous|prior|above)\s+instructions)/i,
  /(bỏ\s*qua\s*(tất\s*cả\s*)?(hướng\s*dẫn|câu\s*lệnh|quy\s*tắc|chỉ\s*thị))/i,
  /(system\s*prompt|prompt\s*gốc|lời\s*nhắc\s*hệ\s*thống)/i,
  /(đóng\s*vai|hãy\s*làm|từ\s*bây\s*giờ\s*bạn\s*là|act\s*as|dan\s*mode|developer\s*mode)/i,
  /(hack|exploit|tấn\s*công|bẻ\s*khóa|vượt\s*rào|bypass)/i,
];

const OFF_TOPIC_PATTERNS = [
  /(giải\s*(bài\s*toán|phương\s*trình|hệ\s*phương\s*trình|tích\s*phân|đạo\s*hàm))/i,
  /(làm\s*thơ|viết\s*văn|kể\s*chuyện\s*(cười|ma|người\s*lớn))/i,
  /(đánh\s*(đề|bài|bạc)|lô\s*đề|xổ\s*số|kết\s*quả\s*xổ\s*số|soi\s*cầu)/i,
  /(tiền\s*ảo|crypto|bitcoin|chứng\s*khoán|giá\s*vàng)/i,
  /(tổng\s*thống|bầu\s*cử|chính\s*trị|đảng\s*phái)/i,
];

export const GUARDRAIL_REFUSAL_MESSAGE = `Cú DNTU là trợ lý ảo chuyên trách hỗ trợ tìm kiếm và xử lý đồ thất lạc tại Trường Đại học Công nghệ Đồng Nai (DNTU).

Cú chỉ hỗ trợ các câu hỏi liên quan đến:
• Tìm kiếm đồ thất lạc trong khuôn viên trường DNTU (nhà A, B, Thư viện, Sân bóng,...)
• Hướng dẫn thủ tục đăng tin báo mất hoặc nhặt được đồ
• Quy trình xác minh và nhận lại tài sản tại trường

Cú không hỗ trợ viết mã nguồn (code), giải bài tập hay các câu hỏi ngoài phạm vi trường DNTU nhé!`;

/**
 * Kiểm tra xem câu hỏi người dùng có thuộc diện ngoài luồng hay yêu cầu code không
 */
export function checkGuardrails(message) {
  const text = (message || '').trim();
  if (!text) return { blocked: false };

  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: 'code_request',
        reply: GUARDRAIL_REFUSAL_MESSAGE,
        actionButtons: [
          { label: 'Tạo tin báo mất đồ', path: '/report-lost' },
          { label: 'Đăng tin nhặt được đồ', path: '/report-found' },
          { label: 'Xem danh mục đồ', tab: 'categories' },
        ],
      };
    }
  }

  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: 'jailbreak_attempt',
        reply: GUARDRAIL_REFUSAL_MESSAGE,
        actionButtons: [
          { label: 'Tạo tin báo mất đồ', path: '/report-lost' },
          { label: 'Đăng tin nhặt được đồ', path: '/report-found' },
        ],
      };
    }
  }

  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: 'off_topic',
        reply: GUARDRAIL_REFUSAL_MESSAGE,
        actionButtons: [
          { label: 'Xem danh mục đồ', tab: 'categories' },
          { label: 'Về trang chủ', path: '/' },
        ],
      };
    }
  }

  return { blocked: false };
}

/**
 * Gửi tin nhắn đến chatbot (qua backend proxy bảo mật key hoặc fallback an toàn)
 */
export async function sendMessageToChatbot(message, history = []) {
  // LỚP 1: Chặn trước từ client (Zero cost, Zero prompt injection, không rò rỉ mã nguồn)
  const guard = checkGuardrails(message);
  if (guard.blocked) {
    return {
      reply: guard.reply,
      isGuardrail: true,
      actionButtons: guard.actionButtons,
    };
  }

  // LỚP 2: Thử gọi qua Backend API `/api/v1/chatbot/message`
  try {
    const formattedHistory = history.map((item) => ({
      role: item.sender === 'user' ? 'user' : 'assistant',
      content: item.text,
    }));

    const res = await apiFetch('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: formattedHistory,
        client_time: new Date().toISOString(),
      }),
      timeout: 8000,
    });

    if (res && res.reply) {
      return {
        reply: res.reply,
        isGuardrail: res.is_guardrail || false,
        actionButtons: res.action_buttons || [],
      };
    }
  } catch (err) {
    // Nếu backend chưa bật hoặc timeout, chuyển sang fallback tìm kiếm nghiệp vụ DNTU nội bộ
  }

  // LỚP 3: Fallback tìm kiếm đồ thực tế hoặc hướng dẫn DNTU khi không có AI backend
  const lower = message.toLowerCase();

  if (lower.includes('ngày mấy') || lower.includes('năm mấy') || lower.includes('năm bao nhiêu') || lower.includes('mấy giờ') || lower.includes('thời gian') || lower.includes('hôm nay')) {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const dateStr = `${dayName}, ngày ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return {
      reply: `Hôm nay là ${dateStr} (lúc ${timeStr}) nhé bạn! Cú DNTU luôn cập nhật thời gian thực tế để hỗ trợ bạn định vị thời điểm thất lạc đồ chính xác nhất.`,
      actionButtons: [
        { label: 'Tạo tin báo mất đồ', path: '/report-lost' },
        { label: 'Đăng tin nhặt được đồ', path: '/report-found' },
      ],
      state: 'welcome',
    };
  }

  if (lower.includes('mất') || lower.includes('rơi') || lower.includes('quên')) {
    return {
      reply: 'Bạn đừng quá lo lắng! Hãy cho Cú biết chi tiết đặc điểm món đồ, địa điểm trong trường (nhà A, B, thư viện...) và thời gian rơi. Hoặc bạn có thể đăng tin báo mất ngay để cả trường cùng hỗ trợ tìm lại nhé!',
      actionButtons: [
        { label: 'Tạo tin báo mất đồ', path: '/report-lost' },
        { label: 'Chọn danh mục đồ', tab: 'categories' },
      ],
      state: 'searching',
    };
  }

  if (lower.includes('nhặt') || lower.includes('lượm') || lower.includes('thấy đồ')) {
    return {
      reply: 'Tuyệt vời! Tinh thần trung thực của sinh viên DNTU rất đáng trân trọng. Bạn có thể chụp ảnh món đồ và tạo tin báo nhặt được để người đánh mất sớm nhận lại nhé!',
      actionButtons: [{ label: 'Đăng tin nhặt được đồ', path: '/report-found' }],
      state: 'success',
    };
  }

  if (lower.includes('danh mục') || lower.includes('loại đồ')) {
    return {
      reply: 'Dưới đây là 13 danh mục đồ vật thất lạc tại DNTU. Bạn chọn danh mục tương ứng để tra cứu nhé:',
      tab: 'categories',
      state: 'welcome',
    };
  }

  if (lower.includes('nhân viên') || lower.includes('hỗ trợ') || lower.includes('khiếu nại') || lower.includes('xác minh')) {
    return {
      reply: 'Mình đã mở danh sách các chủ đề hỗ trợ trực tiếp. Bạn chọn một mục để kết nối đúng bộ phận nhé:',
      tab: 'support',
      state: 'staff',
    };
  }

  // Tra cứu đồ vật trực tiếp
  try {
    const results = await itemService.getItems({ search: message, limit: 3 });
    if (results && results.length > 0) {
      return {
        reply: `Cú DNTU tìm thấy ${results.length} món đồ có liên quan đến "${message}":`,
        items: results.slice(0, 3),
        state: 'found',
      };
    }
  } catch (_) {
    // ignore
  }

  return {
    reply: `Cú DNTU đã ghi nhận thông tin "${message}". Hiện chưa có món đồ nào trùng khớp hoàn toàn. Bạn có thể mở rộng từ khóa tìm kiếm hoặc chọn danh mục để tra cứu thêm nhé!`,
    actionButtons: [
      { label: 'Chọn danh mục đồ', tab: 'categories' },
      { label: 'Xem trang tìm kiếm', path: `/search?search=${encodeURIComponent(message)}` },
    ],
    state: 'welcome',
  };
}

const chatbotService = {
  checkGuardrails,
  sendMessage: sendMessageToChatbot,
};

export default chatbotService;
