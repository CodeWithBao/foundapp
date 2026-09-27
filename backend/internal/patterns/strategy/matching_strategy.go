package strategy

import (
	"math"
	"strings"
	"time"
	"unicode"

	"unifind-dntu/internal/models"
)

type MatchBreakdown struct {
	Category float64 `json:"category"`
	Text     float64 `json:"text"`
	Image    float64 `json:"image"`
	Location float64 `json:"location"`
	Date     float64 `json:"date"`
	Color    float64 `json:"color"`
	Brand    float64 `json:"brand"`
	Total    float64 `json:"total"`
}

type MatchExplanation struct {
	Score     float64        `json:"score"`
	Breakdown MatchBreakdown `json:"breakdown"`
	Reasons   []string       `json:"reasons"`
}

type MatchingStrategy interface {
	CalculateScore(lostItem *models.Item, foundItem *models.Item) float64
}

type CategoryLocationMatchingStrategy struct{}

func (s *CategoryLocationMatchingStrategy) CalculateScore(lost, found *models.Item) float64 {
	return s.Explain(lost, found).Score
}

func (s *CategoryLocationMatchingStrategy) Explain(lost, found *models.Item) MatchExplanation {
	if lost == nil || found == nil {
		return MatchExplanation{}
	}

	result := MatchExplanation{Reasons: []string{}}
	if lost.CategoryID > 0 && lost.CategoryID == found.CategoryID {
		result.Breakdown.Category = 20
		result.Reasons = append(result.Reasons, "Cùng danh mục vật phẩm")
	}

	textScore := textSimilarity(itemSearchText(lost), itemSearchText(found))
	result.Breakdown.Text = round1(textScore * 25)
	if textScore >= 0.55 {
		result.Reasons = append(result.Reasons, "Tên, mô tả và đặc điểm nhận dạng rất giống")
	} else if textScore >= 0.25 {
		result.Reasons = append(result.Reasons, "Có nhiều từ khóa mô tả trùng nhau")
	}

	imageScore := imageHashSimilarity(lost.ImageFingerprint, found.ImageFingerprint)
	result.Breakdown.Image = round1(imageScore * 25)
	if imageScore >= 0.82 {
		result.Reasons = append(result.Reasons, "Hình ảnh có độ tương đồng cao")
	} else if imageScore >= 0.62 {
		result.Reasons = append(result.Reasons, "Hình ảnh có nét tương đồng")
	}

	if lost.LocationID > 0 && lost.LocationID == found.LocationID {
		result.Breakdown.Location = 10
		result.Reasons = append(result.Reasons, "Cùng khu vực trong trường")
	}

	result.Breakdown.Date = dateProximityScore(lost.Date, found.Date)
	if result.Breakdown.Date >= 7 {
		result.Reasons = append(result.Reasons, "Thời điểm mất và nhặt được gần nhau")
	}

	if equalMeaningful(lost.Color, found.Color) {
		result.Breakdown.Color = 5
		result.Reasons = append(result.Reasons, "Màu sắc trùng khớp")
	}
	if equalMeaningful(lost.Brand, found.Brand) {
		result.Breakdown.Brand = 5
		result.Reasons = append(result.Reasons, "Thương hiệu trùng khớp")
	}

	b := &result.Breakdown
	b.Total = round1(math.Min(100, b.Category+b.Text+b.Image+b.Location+b.Date+b.Color+b.Brand))
	result.Score = b.Total
	return result
}

func itemSearchText(item *models.Item) string {
	return strings.Join([]string{item.Title, item.Description, item.DistinctFeatures, item.Color, item.Brand}, " ")
}

func textSimilarity(a, b string) float64 {
	aTokens, bTokens := tokenSet(a), tokenSet(b)
	if len(aTokens) == 0 || len(bTokens) == 0 {
		return 0
	}
	common := 0
	for token := range aTokens {
		if bTokens[token] {
			common++
		}
	}
	return float64(2*common) / float64(len(aTokens)+len(bTokens))
}

func tokenSet(value string) map[string]bool {
	stopWords := map[string]bool{"toi": true, "bi": true, "mat": true, "nhat": true, "duoc": true, "do": true, "mot": true, "cai": true, "tai": true, "o": true, "va": true, "co": true, "la": true}
	clean := normalizeVietnamese(value)
	returnSet := map[string]bool{}
	for _, token := range strings.FieldsFunc(clean, func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsDigit(r) }) {
		if len([]rune(token)) >= 2 && !stopWords[token] {
			returnSet[token] = true
		}
	}
	return returnSet
}

func normalizeVietnamese(value string) string {
	replacer := strings.NewReplacer(
		"à", "a", "á", "a", "ạ", "a", "ả", "a", "ã", "a", "â", "a", "ầ", "a", "ấ", "a", "ậ", "a", "ẩ", "a", "ẫ", "a", "ă", "a", "ằ", "a", "ắ", "a", "ặ", "a", "ẳ", "a", "ẵ", "a",
		"è", "e", "é", "e", "ẹ", "e", "ẻ", "e", "ẽ", "e", "ê", "e", "ề", "e", "ế", "e", "ệ", "e", "ể", "e", "ễ", "e",
		"ì", "i", "í", "i", "ị", "i", "ỉ", "i", "ĩ", "i", "ò", "o", "ó", "o", "ọ", "o", "ỏ", "o", "õ", "o", "ô", "o", "ồ", "o", "ố", "o", "ộ", "o", "ổ", "o", "ỗ", "o", "ơ", "o", "ờ", "o", "ớ", "o", "ợ", "o", "ở", "o", "ỡ", "o",
		"ù", "u", "ú", "u", "ụ", "u", "ủ", "u", "ũ", "u", "ư", "u", "ừ", "u", "ứ", "u", "ự", "u", "ử", "u", "ữ", "u", "ỳ", "y", "ý", "y", "ỵ", "y", "ỷ", "y", "ỹ", "y", "đ", "d",
	)
	return replacer.Replace(strings.ToLower(strings.TrimSpace(value)))
}

func imageHashSimilarity(a, b string) float64 {
	if len(a) < 16 || len(a) != len(b) {
		return 0
	}
	different := 0
	for i := range a {
		if a[i] != b[i] {
			different++
		}
	}
	return math.Max(0, 1-float64(different)/float64(len(a)))
}

func dateProximityScore(a, b string) float64 {
	left, errLeft := time.Parse("2006-01-02", a)
	right, errRight := time.Parse("2006-01-02", b)
	if errLeft != nil || errRight != nil {
		return 0
	}
	days := math.Abs(left.Sub(right).Hours() / 24)
	switch {
	case days <= 1:
		return 10
	case days <= 3:
		return 8
	case days <= 7:
		return 5
	case days <= 14:
		return 2
	default:
		return 0
	}
}

func equalMeaningful(a, b string) bool {
	a, b = normalizeVietnamese(a), normalizeVietnamese(b)
	return a != "" && b != "" && (a == b || strings.Contains(a, b) || strings.Contains(b, a))
}

func round1(value float64) float64 { return math.Round(value*10) / 10 }

type MatchingContext struct{ strategy MatchingStrategy }

func NewMatchingContext(strategy MatchingStrategy) *MatchingContext { return &MatchingContext{strategy: strategy} }
func (mc *MatchingContext) SetStrategy(strategy MatchingStrategy)     { mc.strategy = strategy }
func (mc *MatchingContext) Match(lost, found *models.Item) float64 {
	if mc.strategy == nil { return 0 }
	return mc.strategy.CalculateScore(lost, found)
}
