package models

import (
	"time"
)

type AuditLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index" json:"user_id"`
	UserName    string    `gorm:"type:varchar(100)" json:"user_name"`
	Action      string    `gorm:"type:varchar(100);not null" json:"action"`
	Entity      string    `gorm:"type:varchar(100);not null" json:"entity"`
	EntityID    uint      `gorm:"index" json:"entity_id"`
	Description string    `gorm:"type:text" json:"description"`
	IPAddress   string    `gorm:"type:varchar(45)" json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}
