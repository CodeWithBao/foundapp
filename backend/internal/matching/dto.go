package matching

import (
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/strategy"
)

type MatchItemDTO struct {
	ID        uint                    `json:"matchId"`
	LostItem  models.Item             `json:"lostItem"`
	FoundItem models.Item             `json:"foundItem"`
	Score     float64                 `json:"score"`
	Reasons   []string                `json:"reasons"`
	Breakdown strategy.MatchBreakdown `json:"breakdown"`
	MatchedAt time.Time               `json:"matchedAt"`
}
