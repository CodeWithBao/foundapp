package strategy_test

import (
	"testing"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/strategy"
)

func TestCategoryLocationMatchingStrategy_ExactMatch(t *testing.T) {
	strat := &strategy.CategoryLocationMatchingStrategy{}
	ctx := strategy.NewMatchingContext(strat)

	lost := &models.Item{
		CategoryID: 1,
		LocationID: 2,
		Title:      "iPhone 15 Pro Max màu xanh",
		Brand:      "Apple",
		Color:      "Blue",
		Date:       "2026-09-16",
	}

	found := &models.Item{
		CategoryID: 1,
		LocationID: 2,
		Title:      "Nhặt được iPhone 15 Pro Max xanh",
		Brand:      "Apple",
		Color:      "Blue",
		Date:       "2026-09-16",
	}

	score := ctx.Match(lost, found)
	if score < 70.0 {
		t.Errorf("Expected high match score (>= 70.0), got %f", score)
	}
}

func TestCategoryLocationMatchingStrategy_NoMatch(t *testing.T) {
	strat := &strategy.CategoryLocationMatchingStrategy{}
	ctx := strategy.NewMatchingContext(strat)

	lost := &models.Item{
		CategoryID: 1,
		LocationID: 1,
		Title:      "Ví da nam màu đen",
		Brand:      "Pedro",
		Color:      "Black",
	}

	found := &models.Item{
		CategoryID: 5,
		LocationID: 9,
		Title:      "Áo khoác gió đỏ",
		Brand:      "Nike",
		Color:      "Red",
	}

	score := ctx.Match(lost, found)
	if score > 20.0 {
		t.Errorf("Expected low match score (<= 20.0), got %f", score)
	}
}

func TestMatchingContext_SetStrategy(t *testing.T) {
	strat1 := &strategy.CategoryLocationMatchingStrategy{}
	ctx := strategy.NewMatchingContext(strat1)

	if ctx == nil {
		t.Fatalf("Expected non-nil MatchingContext")
	}

	ctx.SetStrategy(strat1)
}
