package models

import (
	"time"

	"gorm.io/gorm"
)

type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "PENDING"
	ReportStatusReviewing ReportStatus = "REVIEWING"
	ReportStatusResolved  ReportStatus = "RESOLVED"
	ReportStatusRejected  ReportStatus = "REJECTED"
)

type Report struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	PostID      uint           `gorm:"not null;uniqueIndex:idx_post_reporter" json:"post_id"`
	ReporterID  uint           `gorm:"not null;uniqueIndex:idx_post_reporter" json:"reporter_id"`
	Reason      string         `gorm:"type:varchar(255);not null" json:"reason"`
	Description string         `gorm:"type:text" json:"description"`
	Status      ReportStatus   `gorm:"type:varchar(30);default:'PENDING'" json:"status"`
	AdminNote   string         `gorm:"type:text" json:"admin_note"`
	HandledBy   *uint          `json:"handled_by,omitempty"`
	HandledAt   *time.Time     `json:"handled_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Item     Item  `gorm:"foreignKey:PostID" json:"item,omitempty"`
	Reporter User  `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
	Handler  *User `gorm:"foreignKey:HandledBy" json:"handler,omitempty"`
}
