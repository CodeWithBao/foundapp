package models

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleUser  Role = "USER"
	RoleStaff Role = "STAFF"
	RoleAdmin Role = "ADMIN"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"type:varchar(100);not null" json:"name"`
	Email        string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"`
	Role         Role           `gorm:"type:varchar(20);default:'USER'" json:"role"`
	Phone        string         `gorm:"type:varchar(20)" json:"phone"`
	StudentID    string         `gorm:"type:varchar(50)" json:"student_id"`
	Avatar       string         `gorm:"type:text" json:"avatar"`
	Status       string         `gorm:"type:varchar(20);default:'ACTIVE'" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
