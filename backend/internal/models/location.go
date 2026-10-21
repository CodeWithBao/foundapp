package models

type Location struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"type:varchar(100);not null" json:"name"`
	Code        string `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Description string `gorm:"type:text" json:"description"`
	Building    string `gorm:"type:varchar(100)" json:"building"`
	MapKey      string `gorm:"type:varchar(30);index" json:"map_key"`
	ImageURL    string `gorm:"type:text" json:"image_url"`
	Photos      string `gorm:"type:text" json:"photos"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}
