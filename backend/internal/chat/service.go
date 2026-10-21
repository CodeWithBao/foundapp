package chat

import (
	"errors"
	"fmt"
	"strings"
	"time"
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

var (
	ErrForbidden       = errors.New("bạn không có quyền truy cập cuộc trò chuyện này")
	ErrInvalidChat     = errors.New("cuộc trò chuyện không hợp lệ")
	ErrItemClosed      = errors.New("vật phẩm đã được bàn giao hoặc đóng, cuộc trò chuyện chỉ có thể xem")
	ErrConversationBan = errors.New("cuộc trò chuyện đang bị chặn")
)

type ConversationView struct {
	ID            uint              `json:"id"`
	ItemID        uint              `json:"item_id"`
	ItemTitle     string            `json:"item_title"`
	ItemImage     string            `json:"item_image"`
	ItemType      models.ItemType   `json:"item_type"`
	ItemStatus    models.ItemStatus `json:"item_status"`
	ItemLocation  string            `json:"item_location"`
	Recipient     UserView          `json:"recipient"`
	Blocked       bool              `json:"blocked"`
	BlockedByMe   bool              `json:"blocked_by_me"`
	UnreadCount   int               `json:"unread_count"`
	LastMessageAt time.Time         `json:"last_message_at"`
	LastMessage   *MessageView      `json:"last_message,omitempty"`
	Messages      []MessageView     `json:"messages,omitempty"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type UserView struct {
	ID     uint        `json:"id"`
	Name   string      `json:"name"`
	Avatar string      `json:"avatar"`
	Role   models.Role `json:"role"`
}

type MessageView struct {
	ID             uint      `json:"id"`
	ConversationID uint      `json:"conversation_id"`
	SenderID       uint      `json:"sender_id"`
	SenderName     string    `json:"sender_name"`
	SenderAvatar   string    `json:"sender_avatar"`
	Text           string    `json:"text"`
	Image          string    `json:"image"`
	Read           bool      `json:"read"`
	CreatedAt      time.Time `json:"created_at"`
}

type Service interface {
	GetOrCreateConversation(currentUserID uint, dto CreateConversationDTO) (*ConversationView, error)
	GetConversations(currentUserID uint) ([]ConversationView, error)
	GetConversation(currentUserID, conversationID uint) (*ConversationView, error)
	SendMessage(currentUserID, conversationID uint, dto SendMessageDTO) (*MessageView, error)
	MarkRead(currentUserID, conversationID uint) error
	SetBlocked(currentUserID, conversationID uint, blocked bool) error
}

type service struct{ repo Repository }

func NewService(repo Repository) Service { return &service{repo: repo} }

func sortedParticipants(a, b uint) (uint, uint) {
	if a < b {
		return a, b
	}
	return b, a
}

func (s *service) GetOrCreateConversation(currentUserID uint, dto CreateConversationDTO) (*ConversationView, error) {
	if currentUserID == 0 || dto.RecipientID == 0 || currentUserID == dto.RecipientID {
		return nil, ErrInvalidChat
	}
	item, err := s.repo.FindItem(dto.ItemID)
	if err != nil {
		return nil, err
	}
	if item.UserID != currentUserID && item.UserID != dto.RecipientID {
		return nil, ErrForbidden
	}
	if _, err := s.repo.FindUser(dto.RecipientID); err != nil {
		return nil, err
	}
	a, b := sortedParticipants(currentUserID, dto.RecipientID)
	conversation, err := s.repo.FindConversation(dto.ItemID, a, b)
	if err != nil {
		return nil, err
	}
	if conversation == nil {
		now := time.Now()
		conversation = &models.ChatConversation{
			ItemID: dto.ItemID, ParticipantA: a, ParticipantB: b,
			LastMessageAt: now,
		}
		if err := s.repo.CreateConversation(conversation); err != nil {
			return nil, err
		}
		conversation, err = s.repo.FindConversation(dto.ItemID, a, b)
		if err != nil {
			return nil, err
		}
	}
	return s.buildConversationView(conversation, currentUserID, true)
}

func (s *service) GetConversations(currentUserID uint) ([]ConversationView, error) {
	conversations, err := s.repo.FindConversationsByUser(currentUserID)
	if err != nil {
		return nil, err
	}
	views := make([]ConversationView, 0, len(conversations))
	for i := range conversations {
		view, viewErr := s.buildConversationView(&conversations[i], currentUserID, true)
		if viewErr != nil {
			return nil, viewErr
		}
		view.Messages = nil
		views = append(views, *view)
	}
	return views, nil
}

func (s *service) GetConversation(currentUserID, conversationID uint) (*ConversationView, error) {
	conversation, err := s.authorize(currentUserID, conversationID)
	if err != nil {
		return nil, err
	}
	return s.buildConversationView(conversation, currentUserID, true)
}

func (s *service) SendMessage(currentUserID, conversationID uint, dto SendMessageDTO) (*MessageView, error) {
	conversation, err := s.authorize(currentUserID, conversationID)
	if err != nil {
		return nil, err
	}
	text := strings.TrimSpace(dto.Text)
	imageURL := strings.TrimSpace(dto.ImageURL)
	if text == "" && imageURL == "" {
		return nil, errors.New("nội dung tin nhắn hoặc hình ảnh không được để trống")
	}
	if len([]rune(text)) > 2000 {
		return nil, errors.New("tin nhắn không được vượt quá 2000 ký tự")
	}
	if len(imageURL) > 4*1024*1024 {
		return nil, errors.New("ảnh đính kèm vượt quá giới hạn cho phép")
	}
	if conversation.BlockedByA || conversation.BlockedByB {
		return nil, ErrConversationBan
	}
	if conversation.Item.Status == models.ItemStatusReturned || conversation.Item.Status == models.ItemStatusClosed {
		return nil, ErrItemClosed
	}

	sender, err := s.repo.FindUser(currentUserID)
	if err != nil {
		return nil, err
	}
	recipientID := conversation.ParticipantA
	if recipientID == currentUserID {
		recipientID = conversation.ParticipantB
	}
	now := time.Now()
	message := &models.ChatMessage{
		ConversationID: conversation.ID,
		SenderID:       currentUserID,
		Text:           text,
		ImageURL:       imageURL,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	snippet := text
	if snippet == "" {
		snippet = "[Hình ảnh]"
	}
	if runes := []rune(snippet); len(runes) > 80 {
		snippet = string(runes[:80]) + "…"
	}
	notification := &models.Notification{
		UserID:  recipientID,
		Title:   fmt.Sprintf("Tin nhắn mới từ %s", sender.Name),
		Message: fmt.Sprintf("%s · %s", conversation.Item.Title, snippet),
		Type:    "chat_message", RelatedID: conversation.ItemID,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := s.repo.CreateMessage(conversation, message, notification, sender); err != nil {
		return nil, err
	}
	view := messageToView(*message, *sender)
	return &view, nil
}

func (s *service) MarkRead(currentUserID, conversationID uint) error {
	if _, err := s.authorize(currentUserID, conversationID); err != nil {
		return err
	}
	return s.repo.MarkMessagesRead(conversationID, currentUserID, time.Now())
}

func (s *service) SetBlocked(currentUserID, conversationID uint, blocked bool) error {
	if _, err := s.authorize(currentUserID, conversationID); err != nil {
		return err
	}
	return s.repo.SetBlocked(conversationID, currentUserID, blocked)
}

func (s *service) authorize(currentUserID, conversationID uint) (*models.ChatConversation, error) {
	conversation, err := s.repo.FindConversationByID(conversationID)
	if err != nil {
		return nil, err
	}
	if conversation.ParticipantA != currentUserID && conversation.ParticipantB != currentUserID {
		return nil, ErrForbidden
	}
	return conversation, nil
}

func (s *service) buildConversationView(conversation *models.ChatConversation, currentUserID uint, includeMessages bool) (*ConversationView, error) {
	if conversation.ParticipantA != currentUserID && conversation.ParticipantB != currentUserID {
		return nil, ErrForbidden
	}
	recipient := conversation.UserA
	blockedByMe := conversation.BlockedByB
	if conversation.ParticipantA == currentUserID {
		recipient = conversation.UserB
		blockedByMe = conversation.BlockedByA
	}
	messages, err := s.repo.FindMessages(conversation.ID)
	if err != nil {
		return nil, err
	}
	messageViews := make([]MessageView, 0, len(messages))
	unreadCount := 0
	for _, message := range messages {
		view := messageToView(message, message.Sender)
		messageViews = append(messageViews, view)
		if message.SenderID != currentUserID && message.ReadAt == nil {
			unreadCount++
		}
	}
	itemImage := ""
	if len(conversation.Item.Images) > 0 {
		itemImage = conversation.Item.Images[0].ImageURL
	}
	view := &ConversationView{
		ID: conversation.ID, ItemID: conversation.ItemID,
		ItemTitle: conversation.Item.Title, ItemImage: itemImage,
		ItemType: conversation.Item.Type, ItemStatus: conversation.Item.Status,
		ItemLocation: conversation.Item.Location.Name,
		Recipient:    UserView{ID: recipient.ID, Name: recipient.Name, Avatar: firstNonEmpty(recipient.AvatarURL, recipient.Avatar), Role: recipient.Role},
		Blocked:      conversation.BlockedByA || conversation.BlockedByB,
		BlockedByMe:  blockedByMe, UnreadCount: unreadCount,
		LastMessageAt: conversation.LastMessageAt,
		CreatedAt:     conversation.CreatedAt, UpdatedAt: conversation.UpdatedAt,
	}
	if len(messageViews) > 0 {
		last := messageViews[len(messageViews)-1]
		view.LastMessage = &last
	}
	if includeMessages {
		view.Messages = messageViews
	}
	return view, nil
}

func messageToView(message models.ChatMessage, sender models.User) MessageView {
	return MessageView{
		ID: message.ID, ConversationID: message.ConversationID,
		SenderID: message.SenderID, SenderName: sender.Name,
		SenderAvatar: firstNonEmpty(sender.AvatarURL, sender.Avatar),
		Text:         message.Text, Image: message.ImageURL,
		Read: message.ReadAt != nil, CreatedAt: message.CreatedAt,
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func IsNotFound(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) }
