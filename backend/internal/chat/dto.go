package chat

type CreateConversationDTO struct {
	ItemID      uint `json:"item_id" binding:"required"`
	RecipientID uint `json:"recipient_id" binding:"required"`
}

type SendMessageDTO struct {
	Text     string `json:"text"`
	ImageURL string `json:"image_url"`
}

type SetBlockDTO struct {
	Blocked bool `json:"blocked"`
}
