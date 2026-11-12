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
	Pinned        bool              `json:"pinned"`
	ManualUnread  bool              `json:"manual_unread"`
	Archived      bool              `json:"archived"`
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
	ClientMessageID *string    `json:"client_message_id"`
	ReplyToID       *uint      `json:"reply_to_id"`
	Forwarded       bool       `json:"forwarded"`
	RecalledAt      *time.Time `json:"recalled_at"`
	ID              uint       `json:"id"`
	ConversationID  uint       `json:"conversation_id"`
	SenderID        uint       `json:"sender_id"`
	SenderName      string     `json:"sender_name"`
	SenderAvatar    string     `json:"sender_avatar"`
	Text            string     `json:"text"`
	Image           string     `json:"image"`
	Read            bool       `json:"read"`
	CreatedAt       time.Time  `json:"created_at"`
}

type Service interface {
	SetPinned(userID, conversationID uint, value bool) error
	SetUnread(userID, conversationID uint, value bool) error
	Recall(userID, conversationID, messageID uint) error
	Forward(userID, conversationID uint, dto ForwardMessageDTO) (*MessageView, error)
	Report(userID, conversationID uint, reason string) (*models.ChatReport, error)
	GetOrCreateConversation(currentUserID uint, dto CreateConversationDTO) (*ConversationView, error)
	GetConversations(currentUserID uint) ([]ConversationView, error)
	GetConversation(currentUserID, conversationID uint) (*ConversationView, error)
	SendMessage(currentUserID, conversationID uint, dto SendMessageDTO) (*MessageView, error)
	MarkRead(currentUserID, conversationID uint) error
	SetBlocked(currentUserID, conversationID uint, blocked bool) error
	SetArchived(currentUserID, conversationID uint, archived bool) error
	DeleteConversation(currentUserID, conversationID uint) error
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
		// Opening an item chat prepares a draft; only visible message history
		// makes it an inbox conversation (including images and recalled messages).
		if len(view.Messages) == 0 {
			continue
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
	return s.sendMessage(currentUserID, conversationID, dto, nil)
}

func (s *service) sendMessage(currentUserID, conversationID uint, dto SendMessageDTO, forwardID *uint) (*MessageView, error) {
	conversation, err := s.authorize(currentUserID, conversationID)
	if err != nil {
		return nil, err
	}
	clientID := strings.TrimSpace(dto.ClientMessageID)
	if len(clientID) > 128 {
		return nil, ErrInvalidChat
	}
	if clientID != "" {
		existing, err := s.repo.FindClientMessage(conversationID, currentUserID, clientID)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			view := messageToView(*existing, existing.Sender)
			return &view, nil
		}
	}
	if dto.ReplyToID != nil {
		if _, err := s.visibleMessage(conversation, currentUserID, *dto.ReplyToID); err != nil {
			return nil, err
		}
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
	message.ReplyToID = dto.ReplyToID
	message.ForwardSourceID = forwardID
	if clientID != "" {
		message.ClientMessageID = &clientID
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
	if err := s.repo.MarkMessagesRead(conversationID, currentUserID, time.Now()); err != nil {
		return err
	}
	return s.repo.SetPreference(conversationID, currentUserID, "manual_unread", false)
}

func (s *service) SetBlocked(currentUserID, conversationID uint, blocked bool) error {
	if _, err := s.authorize(currentUserID, conversationID); err != nil {
		return err
	}
	return s.repo.SetBlocked(conversationID, currentUserID, blocked)
}

func (s *service) SetArchived(currentUserID, conversationID uint, archived bool) error {
	if _, err := s.authorize(currentUserID, conversationID); err != nil {
		return err
	}
	return s.repo.SetConversationState(conversationID, currentUserID, &archived, nil)
}

func (s *service) DeleteConversation(currentUserID, conversationID uint) error {
	if _, err := s.authorize(currentUserID, conversationID); err != nil {
		return err
	}
	now := time.Now()
	return s.repo.SetConversationState(conversationID, currentUserID, nil, &now)
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
	archived := conversation.ArchivedByB
	deletedAt := conversation.DeletedByBAt
	if conversation.ParticipantA == currentUserID {
		archived = conversation.ArchivedByA
		deletedAt = conversation.DeletedByAAt
	}
	messages, err := s.repo.FindMessages(conversation.ID)
	if err != nil {
		return nil, err
	}
	messageViews := make([]MessageView, 0, len(messages))
	unreadCount := 0
	for _, message := range messages {
		if deletedAt != nil && !message.CreatedAt.After(*deletedAt) {
			continue
		}
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
		Archived:     archived,
		Pinned:       conversation.PinnedByB, ManualUnread: conversation.ManualUnreadByB,
		BlockedByMe: blockedByMe, UnreadCount: unreadCount,
		LastMessageAt: conversation.LastMessageAt,
		CreatedAt:     conversation.CreatedAt, UpdatedAt: conversation.UpdatedAt,
	}
	if conversation.ParticipantA == currentUserID {
		view.Pinned = conversation.PinnedByA
		view.ManualUnread = conversation.ManualUnreadByA
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
	if message.RecalledAt != nil {
		message.Text = ""
		message.ImageURL = ""
	}
	return MessageView{
		ClientMessageID: message.ClientMessageID, ReplyToID: message.ReplyToID, Forwarded: message.ForwardSourceID != nil, RecalledAt: message.RecalledAt,
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
