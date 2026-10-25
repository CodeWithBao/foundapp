package models

type Category struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"type:varchar(100);not null" json:"name"`
	Slug        string `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"`
	Description string `gorm:"type:text" json:"description"`
	Icon        string `gorm:"type:varchar(50)" json:"icon"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}
