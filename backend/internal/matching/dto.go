package matching

import (
	"time"

	"unifind-dntu/internal/models"
)

type MatchItemDTO struct {
	ID        uint        `json:"id"`
	Target    models.Item `json:"target_item"`
	Candidate models.Item `json:"candidate_item"`
	Score     float64     `json:"score"`
	MatchedAt time.Time   `json:"matched_at"`
}
