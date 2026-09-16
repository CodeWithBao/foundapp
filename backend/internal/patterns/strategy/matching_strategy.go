package strategy

import (
	"strings"

	"unifind-dntu/internal/models"
)

type MatchingStrategy interface {
	CalculateScore(lostItem *models.Item, foundItem *models.Item) float64
}

type CategoryLocationMatchingStrategy struct{}

func (s *CategoryLocationMatchingStrategy) CalculateScore(lost *models.Item, found *models.Item) float64 {
	score := 0.0

	if lost.CategoryID == found.CategoryID {
		score += 40.0
	}

	if lost.LocationID == found.LocationID {
		score += 30.0
	}

	if lost.Color != "" && found.Color != "" && strings.EqualFold(lost.Color, found.Color) {
		score += 15.0
	}

	if lost.Brand != "" && found.Brand != "" && strings.EqualFold(lost.Brand, found.Brand) {
		score += 15.0
	}

	return score
}

type MatchingContext struct {
	strategy MatchingStrategy
}

func NewMatchingContext(strategy MatchingStrategy) *MatchingContext {
	return &MatchingContext{strategy: strategy}
}

func (mc *MatchingContext) SetStrategy(strategy MatchingStrategy) {
	mc.strategy = strategy
}

func (mc *MatchingContext) Match(lost *models.Item, found *models.Item) float64 {
	if mc.strategy == nil {
		return 0.0
	}
	return mc.strategy.CalculateScore(lost, found)
}
