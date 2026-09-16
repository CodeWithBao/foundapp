package item

import "unifind-dntu/internal/models"

type CreateItemDTO struct {
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
	CurrentStorageLocation string          `json:"current_storage_location"`
	CustodyStatus          string          `json:"custody_status"`
	Images                 []string        `json:"images"`
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
	Search     string `form:"search"`
	UserID     uint   `form:"user_id"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}
