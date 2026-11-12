package models

import "time"

type ChatConversation struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	ItemID          uint       `gorm:"not null;uniqueIndex:idx_chat_item_participants;index" json:"item_id"`
	ParticipantA    uint       `gorm:"not null;uniqueIndex:idx_chat_item_participants;index" json:"participant_a"`
	ParticipantB    uint       `gorm:"not null;uniqueIndex:idx_chat_item_participants;index" json:"participant_b"`
	BlockedByA      bool       `gorm:"default:false" json:"blocked_by_a"`
	BlockedByB      bool       `gorm:"default:false" json:"blocked_by_b"`
	ArchivedByA     bool       `gorm:"default:false" json:"-"`
	ArchivedByB     bool       `gorm:"default:false" json:"-"`
	DeletedByAAt    *time.Time `json:"-"`
	DeletedByBAt    *time.Time `json:"-"`
	PinnedByA       bool       `gorm:"default:false" json:"-"`
	PinnedByB       bool       `gorm:"default:false" json:"-"`
	ManualUnreadByA bool       `gorm:"default:false" json:"-"`
	ManualUnreadByB bool       `gorm:"default:false" json:"-"`
	LastMessageAt   time.Time  `gorm:"index" json:"last_message_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	Item     Item          `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	UserA    User          `gorm:"foreignKey:ParticipantA" json:"user_a,omitempty"`
	UserB    User          `gorm:"foreignKey:ParticipantB" json:"user_b,omitempty"`
	Messages []ChatMessage `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

type ChatMessage struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	ConversationID  uint       `gorm:"not null;index;uniqueIndex:idx_chat_message_client" json:"conversation_id"`
	SenderID        uint       `gorm:"not null;index;uniqueIndex:idx_chat_message_client" json:"sender_id"`
	ClientMessageID *string    `gorm:"size:128;uniqueIndex:idx_chat_message_client" json:"client_message_id"`
	ReplyToID       *uint      `gorm:"index" json:"reply_to_id"`
	ForwardSourceID *uint      `gorm:"index" json:"-"`
	RecalledAt      *time.Time `json:"recalled_at"`
	Text            string     `gorm:"type:text" json:"text"`
	ImageURL        string     `gorm:"type:text" json:"image_url"`
	ReadAt          *time.Time `gorm:"index" json:"read_at,omitempty"`
	CreatedAt       time.Time  `gorm:"index" json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	Sender User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

// ChatReport is intentionally separate from post reports.
type ChatReport struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ConversationID uint      `gorm:"not null;index" json:"conversation_id"`
	ReporterID     uint      `gorm:"not null;index" json:"reporter_id"`
	Reason         string    `gorm:"type:text;not null" json:"reason"`
	CreatedAt      time.Time `json:"created_at"`
}
