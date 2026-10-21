package models

import "time"

type ChatConversation struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ItemID        uint      `gorm:"not null;uniqueIndex:idx_chat_item_participants;index" json:"item_id"`
	ParticipantA  uint      `gorm:"not null;uniqueIndex:idx_chat_item_participants;index" json:"participant_a"`
	ParticipantB  uint      `gorm:"not null;uniqueIndex:idx_chat_item_participants;index" json:"participant_b"`
	BlockedByA    bool      `gorm:"default:false" json:"blocked_by_a"`
	BlockedByB    bool      `gorm:"default:false" json:"blocked_by_b"`
	LastMessageAt time.Time `gorm:"index" json:"last_message_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Item     Item          `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	UserA    User          `gorm:"foreignKey:ParticipantA" json:"user_a,omitempty"`
	UserB    User          `gorm:"foreignKey:ParticipantB" json:"user_b,omitempty"`
	Messages []ChatMessage `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

type ChatMessage struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	ConversationID uint       `gorm:"not null;index" json:"conversation_id"`
	SenderID       uint       `gorm:"not null;index" json:"sender_id"`
	Text           string     `gorm:"type:text" json:"text"`
	ImageURL       string     `gorm:"type:text" json:"image_url"`
	ReadAt         *time.Time `gorm:"index" json:"read_at,omitempty"`
	CreatedAt      time.Time  `gorm:"index" json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	Sender User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}
