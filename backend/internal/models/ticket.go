package models

import "time"

// SupportTicket is private to its owner and the support team.
type SupportTicket struct {
	ID            string                 `gorm:"primaryKey;size:40" json:"id"`
	UserID        uint                   `gorm:"index;not null" json:"userId"`
	UserName      string                 `json:"userName"`
	UserEmail     string                 `json:"userEmail"`
	UserRole      string                 `json:"userRole"`
	Topic         string                 `json:"topic"`
	Status        string                 `gorm:"index;not null" json:"status"`
	UnreadByStaff bool                   `json:"unreadByStaff"`
	UnreadByAdmin bool                   `json:"unreadByAdmin"`
	UnreadByUser  bool                   `json:"unreadByUser"`
	CreatedAt     time.Time              `json:"createdAt"`
	UpdatedAt     time.Time              `json:"updatedAt"`
	Messages      []SupportTicketMessage `gorm:"foreignKey:TicketID" json:"messages"`
}

type SupportTicketMessage struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	TicketID   string    `gorm:"index;not null" json:"-"`
	Sender     string    `json:"sender"`
	SenderName string    `json:"senderName"`
	Text       string    `gorm:"type:text;not null" json:"text"`
	Time       time.Time `json:"time"`
}
