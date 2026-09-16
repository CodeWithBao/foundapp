package models

import (
	"time"

	"gorm.io/gorm"
)

type ClaimStatus string

const (
	ClaimStatusPending          ClaimStatus = "PENDING"
	ClaimStatusUnderReview      ClaimStatus = "UNDER_REVIEW"
	ClaimStatusApproved         ClaimStatus = "APPROVED"
	ClaimStatusRejected         ClaimStatus = "REJECTED"
	ClaimStatusReadyForHandover ClaimStatus = "READY_FOR_HANDOVER"
	ClaimStatusCompleted        ClaimStatus = "COMPLETED"
)

type Claim struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	ItemID        uint           `gorm:"not null;index" json:"item_id"`
	ClaimantID    uint           `gorm:"not null;index" json:"claimant_id"`
	Reason        string         `gorm:"type:text;not null" json:"reason"`
	SecretDetails string         `gorm:"type:text" json:"secret_details"`
	Status        ClaimStatus    `gorm:"type:varchar(30);default:'PENDING'" json:"status"`
	ReviewNote    string         `gorm:"type:text" json:"review_note"`
	ReviewedBy    *uint          `gorm:"index" json:"reviewed_by"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Item      Item            `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Claimant  User            `gorm:"foreignKey:ClaimantID" json:"claimant,omitempty"`
	Reviewer  *User           `gorm:"foreignKey:ReviewedBy" json:"reviewer,omitempty"`
	Evidences []ClaimEvidence `gorm:"foreignKey:ClaimID" json:"evidences,omitempty"`
}

type ClaimEvidence struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	ClaimID     uint   `gorm:"not null;index" json:"claim_id"`
	ImageURL    string `gorm:"type:text;not null" json:"image_url"`
	Description string `gorm:"type:text" json:"description"`
}
