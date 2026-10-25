package chat

import (
	"errors"
	"testing"
	"time"
	"unifind-dntu/internal/models"
)

type fakeRepository struct {
	item         models.Item
	users        map[uint]models.User
	conversation *models.ChatConversation
	messages     []models.ChatMessage
	created      *models.ChatMessage
	readBy       uint
	blocked      bool
}

func (f *fakeRepository) FindItem(id uint) (*models.Item, error) {
	if f.item.ID != id {
		return nil, errors.New("not found")
	}
	item := f.item
	return &item, nil
}
func (f *fakeRepository) FindUser(id uint) (*models.User, error) {
	user, ok := f.users[id]
	if !ok {
		return nil, errors.New("not found")
	}
	return &user, nil
}
func (f *fakeRepository) FindConversation(_, _, _ uint) (*models.ChatConversation, error) {
	return f.conversation, nil
}
func (f *fakeRepository) FindConversationByID(id uint) (*models.ChatConversation, error) {
	if f.conversation == nil || f.conversation.ID != id {
		return nil, errors.New("not found")
	}
	return f.conversation, nil
}
func (f *fakeRepository) CreateConversation(conversation *models.ChatConversation) error {
	conversation.ID = 10
	conversation.Item = f.item
	conversation.UserA = f.users[conversation.ParticipantA]
	conversation.UserB = f.users[conversation.ParticipantB]
	f.conversation = conversation
	return nil
}
func (f *fakeRepository) FindConversationsByUser(uint) ([]models.ChatConversation, error) {
	if f.conversation == nil {
		return nil, nil
	}
	return []models.ChatConversation{*f.conversation}, nil
}
func (f *fakeRepository) FindMessages(uint) ([]models.ChatMessage, error) { return f.messages, nil }
func (f *fakeRepository) CreateMessage(_ *models.ChatConversation, message *models.ChatMessage, _ *models.Notification, sender *models.User) error {
	message.ID = 99
	message.Sender = *sender
	f.created = message
	f.messages = append(f.messages, *message)
	return nil
}
func (f *fakeRepository) MarkMessagesRead(_ uint, userID uint, _ time.Time) error {
	f.readBy = userID
	return nil
}
func (f *fakeRepository) SetBlocked(_ uint, _ uint, blocked bool) error {
	f.blocked = blocked
	return nil
}

func newFakeRepository() *fakeRepository {
	users := map[uint]models.User{
		1: {ID: 1, Name: "Chủ bài", Role: models.RoleUser},
		2: {ID: 2, Name: "Người hỏi", Role: models.RoleUser},
		3: {ID: 3, Name: "Người ngoài", Role: models.RoleUser},
	}
	return &fakeRepository{
		item:  models.Item{ID: 7, UserID: 1, Title: "Ví đen", Status: models.ItemStatusFound, Type: models.ItemTypeFound},
		users: users,
	}
}

func TestGetOrCreateConversationRequiresItemOwner(t *testing.T) {
	repo := newFakeRepository()
	service := NewService(repo)

	if _, err := service.GetOrCreateConversation(2, CreateConversationDTO{ItemID: 7, RecipientID: 3}); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}

	conversation, err := service.GetOrCreateConversation(2, CreateConversationDTO{ItemID: 7, RecipientID: 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if conversation.ID != 10 || conversation.Recipient.ID != 1 {
		t.Fatalf("unexpected conversation: %+v", conversation)
	}
}

func TestGetOrCreateConversationRejectsSelfChat(t *testing.T) {
	repo := newFakeRepository()
	service := NewService(repo)

	if _, err := service.GetOrCreateConversation(1, CreateConversationDTO{ItemID: 7, RecipientID: 1}); !errors.Is(err, ErrInvalidChat) {
		t.Fatalf("expected ErrInvalidChat, got %v", err)
	}
}

func TestSendMessageAndParticipantAuthorization(t *testing.T) {
	repo := newFakeRepository()
	repo.conversation = &models.ChatConversation{
		ID: 10, ItemID: 7, ParticipantA: 1, ParticipantB: 2,
		Item: repo.item, UserA: repo.users[1], UserB: repo.users[2],
	}
	service := NewService(repo)

	if _, err := service.SendMessage(3, 10, SendMessageDTO{Text: "Xin chào"}); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}

	message, err := service.SendMessage(2, 10, SendMessageDTO{Text: "  Xin chào  "})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if message.Text != "Xin chào" || message.SenderName != "Người hỏi" {
		t.Fatalf("unexpected message: %+v", message)
	}
}

func TestSendMessageRejectsBlockedAndClosedConversation(t *testing.T) {
	repo := newFakeRepository()
	repo.conversation = &models.ChatConversation{
		ID: 10, ItemID: 7, ParticipantA: 1, ParticipantB: 2, BlockedByA: true,
		Item: repo.item, UserA: repo.users[1], UserB: repo.users[2],
	}
	service := NewService(repo)
	if _, err := service.SendMessage(2, 10, SendMessageDTO{Text: "Xin chào"}); !errors.Is(err, ErrConversationBan) {
		t.Fatalf("expected ErrConversationBan, got %v", err)
	}

	repo.conversation.BlockedByA = false
	repo.conversation.Item.Status = models.ItemStatusReturned
	if _, err := service.SendMessage(2, 10, SendMessageDTO{Text: "Xin chào"}); !errors.Is(err, ErrItemClosed) {
		t.Fatalf("expected ErrItemClosed, got %v", err)
	}
}
