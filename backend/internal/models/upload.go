package models

import "time"

// UploadedImage stores user-selected item photos in the configured database.
// Keeping the binary in PostgreSQL/SQLite makes the upload durable on hosts
// where the application filesystem is ephemeral.
type UploadedImage struct {
	ID          string    `gorm:"type:varchar(40);primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	ContentType string    `gorm:"type:varchar(40);not null" json:"content_type"`
	FileName    string    `gorm:"type:varchar(255);not null" json:"file_name"`
	Size        int64     `gorm:"not null" json:"size"`
	Data        []byte    `gorm:"not null" json:"-"`
	CreatedAt   time.Time `json:"created_at"`
}
