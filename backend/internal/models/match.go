package models

import "time"

type Match struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	LostItemID  uint      `gorm:"not null;index:idx_lost_found_match" json:"lost_item_id"`
	FoundItemID uint      `gorm:"not null;index:idx_lost_found_match" json:"found_item_id"`
	Score       float64   `gorm:"type:numeric(5,2);not null" json:"score"`
	MatchedAt   time.Time `json:"matched_at"`

	LostItem  Item `gorm:"foreignKey:LostItemID" json:"lost_item,omitempty"`
	FoundItem Item `gorm:"foreignKey:FoundItemID" json:"found_item,omitempty"`
}
