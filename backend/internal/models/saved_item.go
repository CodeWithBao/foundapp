package models

import "time"

// SavedItem is a durable, user-scoped bookmark. No soft delete: PUT can recreate it.
type SavedItem struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	UserUID   uint      `gorm:"not null;uniqueIndex:idx_saved_user_item,priority:1;index:idx_saved_user_created,priority:1" json:"-"`
	ItemID    uint      `gorm:"not null;uniqueIndex:idx_saved_user_item,priority:2;index" json:"item_id"`
	CreatedAt time.Time `gorm:"not null;index:idx_saved_user_created,priority:2" json:"saved_at"`
	User      User      `gorm:"foreignKey:UserUID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Item      Item      `gorm:"foreignKey:ItemID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}
