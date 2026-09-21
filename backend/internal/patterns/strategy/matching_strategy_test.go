package strategy_test

import (
	"testing"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/strategy"
)

func TestSmartMatchingUsesContentImageAndDate(t *testing.T) {
	matcher := &strategy.CategoryLocationMatchingStrategy{}
	lost := &models.Item{CategoryID: 1, LocationID: 2, Title: "Ví da màu đen Pedro", Description: "Có thẻ sinh viên bên trong", DistinctFeatures: "xước nhẹ góc phải", Color: "Đen", Brand: "Pedro", Date: "2026-09-20", ImageFingerprint: "1111000011110000111100001111000011110000111100001111000011110000"}
	found := &models.Item{CategoryID: 1, LocationID: 2, Title: "Nhặt được ví Pedro đen", Description: "Bên trong có thẻ sinh viên", DistinctFeatures: "góc phải bị xước", Color: "đen", Brand: "PEDRO", Date: "2026-09-21", ImageFingerprint: "1111000011110000111100001111000011110000111100001111000011110001"}

	result := matcher.Explain(lost, found)
	if result.Score < 80 { t.Fatalf("expected a strong match, got %.1f", result.Score) }
	if result.Breakdown.Image == 0 || result.Breakdown.Text == 0 || len(result.Reasons) < 4 { t.Fatalf("expected explainable image/text evidence: %+v", result) }
}

func TestSmartMatchingRejectsUnrelatedItems(t *testing.T) {
	matcher := &strategy.CategoryLocationMatchingStrategy{}
	lost := &models.Item{CategoryID: 1, LocationID: 1, Title: "Ví da đen", Date: "2026-09-01"}
	found := &models.Item{CategoryID: 5, LocationID: 9, Title: "Áo khoác đỏ", Date: "2026-09-20"}
	if score := matcher.CalculateScore(lost, found); score >= 35 { t.Fatalf("expected unrelated items below threshold, got %.1f", score) }
}
