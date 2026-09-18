package models

import (
	"time"

	"gorm.io/gorm"
)

type ItemType string

const (
	ItemTypeLost  ItemType = "LOST"
	ItemTypeFound ItemType = "FOUND"
)

type ItemStatus string

const (
	ItemStatusLost     ItemStatus = "LOST"
	ItemStatusFound    ItemStatus = "FOUND"
	ItemStatusReturned ItemStatus = "RETURNED"
	ItemStatusClosed   ItemStatus = "CLOSED"
)

type Item struct {
	ID                     uint           `gorm:"primaryKey" json:"id"`
	Title                  string         `gorm:"type:varchar(255);not null" json:"title"`
	Type                   ItemType       `gorm:"type:varchar(20);not null" json:"type"`
	CategoryID             uint           `gorm:"not null;index" json:"category_id"`
	LocationID             uint           `gorm:"not null;index" json:"location_id"`
	Date                   string         `gorm:"type:varchar(20)" json:"date"`
	Time                   string         `gorm:"type:varchar(20)" json:"time"`
	Description            string         `gorm:"type:text" json:"description"`
	Color                  string         `gorm:"type:varchar(50)" json:"color"`
	Brand                  string         `gorm:"type:varchar(100)" json:"brand"`
	DistinctFeatures       string         `gorm:"type:text" json:"distinct_features"`
	CurrentStorageLocation string         `gorm:"type:varchar(255)" json:"current_storage_location"`
	CustodyStatus          string         `gorm:"type:varchar(50)" json:"custody_status"`
	Status                 ItemStatus     `gorm:"type:varchar(30);default:'LOST'" json:"status"`
	Views                  int            `gorm:"default:0" json:"views"`
	UserID                 uint           `gorm:"not null;index" json:"user_id"`
	IsLocked               bool           `gorm:"default:false" json:"is_locked"`
	IsHidden               bool           `gorm:"default:false" json:"is_hidden"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`

	Category Category    `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Location Location    `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	User     User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Images   []ItemImage `gorm:"foreignKey:ItemID" json:"images,omitempty"`
}

type ItemImage struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ItemID    uint   `gorm:"not null;index" json:"item_id"`
	ImageURL  string `gorm:"type:text;not null" json:"image_url"`
	IsPrimary bool   `gorm:"default:false" json:"is_primary"`
}
