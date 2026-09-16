package strategy_test

import (
	"testing"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/strategy"
)

func TestCategoryLocationMatchingStrategy(t *testing.T) {
	strat := &strategy.CategoryLocationMatchingStrategy{}
	ctx := strategy.NewMatchingContext(strat)

	lost := &models.Item{
		CategoryID: 1,
		LocationID: 2,
		Color:      "Đen",
		Brand:      "Apple",
	}

	foundExact := &models.Item{
		CategoryID: 1,
		LocationID: 2,
		Color:      "Đen",
		Brand:      "Apple",
	}

	score := ctx.Match(lost, foundExact)
	if score != 100.0 {
		t.Fatalf("expected score 100.0, got %f", score)
	}

	foundDifferent := &models.Item{
		CategoryID: 2,
		LocationID: 3,
		Color:      "Trắng",
		Brand:      "Samsung",
	}

	scoreDiff := ctx.Match(lost, foundDifferent)
	if scoreDiff != 0.0 {
		t.Fatalf("expected score 0.0, got %f", scoreDiff)
	}
}
