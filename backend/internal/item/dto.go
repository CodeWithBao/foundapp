package item

import "unifind-dntu/internal/models"

type CreateItemDTO struct {
	ClientRequestID        string          `json:"client_request_id" binding:"omitempty,max=64"`
	Title                  string          `json:"title" binding:"required"`
	Type                   models.ItemType `json:"type" binding:"required"`
	CategoryID             uint            `json:"category_id" binding:"required"`
	LocationID             uint            `json:"location_id" binding:"required"`
	Date                   string          `json:"date"`
	Time                   string          `json:"time"`
	Description            string          `json:"description"`
	Color                  string          `json:"color"`
	Brand                  string          `json:"brand"`
	DistinctFeatures       string          `json:"distinct_features"`
	ImageFingerprint       string          `json:"image_fingerprint"`
	CurrentStorageLocation string          `json:"current_storage_location"`
	CustodyStatus          string          `json:"custody_status"`
	Images                 []string        `json:"images"`
}

type ItemContactDTO struct {
	Phone string `json:"phone"`
	Email string `json:"email"`
}

type UpdateItemDTO struct {
	Title                  string            `json:"title"`
	CategoryID             uint              `json:"category_id"`
	LocationID             uint              `json:"location_id"`
	Date                   string            `json:"date"`
	Time                   string            `json:"time"`
	Description            string            `json:"description"`
	Color                  string            `json:"color"`
	Brand                  string            `json:"brand"`
	DistinctFeatures       string            `json:"distinct_features"`
	ImageFingerprint       string            `json:"image_fingerprint"`
	CurrentStorageLocation string            `json:"current_storage_location"`
	CustodyStatus          string            `json:"custody_status"`
	Status                 models.ItemStatus `json:"status"`
	Images                 []string          `json:"images"`
}

type ItemFilterDTO struct {
	Status     string `form:"status"`
	Type       string `form:"type"`
	CategoryID uint   `form:"category_id"`
	LocationID uint   `form:"location_id"`
	Category   string `form:"category"`
	Location   string `form:"location"`
	Search     string `form:"search"`
	UserID     uint   `form:"user_id"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}
