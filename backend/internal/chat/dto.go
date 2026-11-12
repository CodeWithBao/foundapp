package chat

type CreateConversationDTO struct {
	ItemID      uint `json:"item_id" binding:"required"`
	RecipientID uint `json:"recipient_id" binding:"required"`
}

type SendMessageDTO struct {
	ReplyToID       *uint  `json:"reply_to_id"`
	ClientMessageID string `json:"client_message_id"`
	Text            string `json:"text"`
	ImageURL        string `json:"image_url"`
}

type SetBlockDTO struct {
	Blocked bool `json:"blocked"`
}

type ForwardMessageDTO struct {
	MessageID            uint   `json:"message_id" binding:"required"`
	SourceConversationID uint   `json:"source_conversation_id" binding:"required"`
	ClientMessageID      string `json:"client_message_id"`
}
