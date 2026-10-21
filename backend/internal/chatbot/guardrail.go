package chatbot

import (
	"regexp"
	"strings"
)

var codePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(viết|cho|lấy|xem|đưa|hướng\s*dẫn)\s+(code|mã\s*nguồn|mã\s*lệnh|script|function|hàm|source\s*code)`),
	regexp.MustCompile(`(?i)(code\s+(python|javascript|golang|go|c\+\+|java|php|html|css|sql|rust|bash|sh|powershell|c#))`),
	regexp.MustCompile(`(?i)(lập\s*trình|thuật\s*toán|debug|fix\s*bug|cú\s*pháp|syntax\s*error|compile|run\s*code)`),
	regexp.MustCompile(`(?i)(database\s*schema|lược\s*đồ\s*bảng|cơ\s*sở\s*dữ\s*liệu|select\s+\*\s+from|insert\s+into|drop\s+table)`),
	regexp.MustCompile(`(?i)(api\s*key|jwt\s*secret|token\s*bảo\s*mật|mật\s*khẩu\s*db|env\s*file|dockerfile)`),
}

var jailbreakPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(ignore\s+(all\s+)?(previous|prior|above)\s+instructions)`),
	regexp.MustCompile(`(?i)(bỏ\s*qua\s*(tất\s*cả\s*)?(hướng\s*dẫn|câu\s*lệnh|quy\s*tắc|chỉ\s*thị))`),
	regexp.MustCompile(`(?i)(system\s*prompt|prompt\s*gốc|lời\s*nhắc\s*hệ\s*thống)`),
	regexp.MustCompile(`(?i)(đóng\s*vai|hãy\s*làm|từ\s*bây\s*giờ\s*bạn\s*là|act\s*as|dan\s*mode|developer\s*mode)`),
	regexp.MustCompile(`(?i)(hack|exploit|tấn\s*công|bẻ\s*khóa|vượt\s*rào|bypass)`),
}

var offTopicPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(giải\s*(bài\s*toán|phương\s*trình|hệ\s*phương\s*trình|tích\s*phân|đạo\s*hàm))`),
	regexp.MustCompile(`(?i)(làm\s*thơ|viết\s*văn|kể\s*chuyện\s*(cười|ma|người\s*lớn))`),
	regexp.MustCompile(`(?i)(đánh\s*(đề|bài|bạc)|lô\s*đề|xổ\s*số|kết\s*quả\s*xổ\s*số|soi\s*cầu)`),
	regexp.MustCompile(`(?i)(tiền\s*ảo|crypto|bitcoin|chứng\s*khoán|giá\s*vàng)`),
	regexp.MustCompile(`(?i)(tổng\s*thống|bầu\s*cử|chính\s*trị|đảng\s*phái)`),
}

const GuardrailRefusalMessage = `Cú DNTU là trợ lý ảo chuyên trách hỗ trợ tìm kiếm và xử lý đồ thất lạc tại Trường Đại học Công nghệ Đồng Nai (DNTU).

Cú chỉ hỗ trợ các vấn đề liên quan đến:
• Tìm kiếm đồ thất lạc trong khuôn viên trường DNTU (nhà A, B, Thư viện, Sân bóng,...)
• Hướng dẫn thủ tục đăng tin báo mất hoặc nhặt được đồ
• Quy trình xác minh và nhận lại tài sản tại trường

Cú không hỗ trợ viết mã nguồn (code), giải bài tập hay các câu hỏi ngoài phạm vi trường DNTU nhé!`

// CheckOffTopic kiểm tra prompt người dùng có vi phạm phạm vi hay không
func CheckOffTopic(message string) (bool, string) {
	trimmed := strings.TrimSpace(message)
	if trimmed == "" {
		return false, ""
	}

	for _, p := range codePatterns {
		if p.MatchString(trimmed) {
			return true, GuardrailRefusalMessage
		}
	}

	for _, p := range jailbreakPatterns {
		if p.MatchString(trimmed) {
			return true, GuardrailRefusalMessage
		}
	}

	for _, p := range offTopicPatterns {
		if p.MatchString(trimmed) {
			return true, GuardrailRefusalMessage
		}
	}

	return false, ""
}
