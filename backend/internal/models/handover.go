package models

import (
	"time"
)

type HandoverRecord struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	ClaimID            uint      `gorm:"not null;index" json:"claim_id"`
	ItemID             uint      `gorm:"not null;index" json:"item_id"`
	RecipientID        uint      `gorm:"not null;index" json:"recipient_id"`
	RecipientName      string    `gorm:"type:varchar(100);not null" json:"recipient_name"`
	RecipientStudentID string    `gorm:"type:varchar(50)" json:"recipient_student_id"`
	StaffID            uint      `gorm:"not null;index" json:"staff_id"`
	HandoverDate       time.Time `json:"handover_date"`
	HandoverLocation   string    `gorm:"type:varchar(255)" json:"handover_location"`
	Notes              string    `gorm:"type:text" json:"notes"`
	CreatedAt          time.Time `json:"created_at"`

	Claim     Claim `gorm:"foreignKey:ClaimID" json:"claim,omitempty"`
	Item      Item  `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Recipient User  `gorm:"foreignKey:RecipientID" json:"recipient,omitempty"`
	Staff     User  `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
}
