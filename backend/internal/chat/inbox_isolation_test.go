package chat

import (
	"fmt"
	"testing"
	"time"
	"unifind-dntu/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// Use a fresh in-memory database: never touch the running application's data.
func TestInboxIsolationAndDraftLifecycle(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{DisableForeignKeyConstraintWhenMigrating: true})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	if err := db.AutoMigrate(&models.User{}, &models.Category{}, &models.Location{}, &models.Item{}, &models.ItemImage{}, &models.ChatConversation{}, &models.ChatMessage{}, &models.Notification{}); err != nil {
		t.Fatal(err)
	}
	for id := uint(1); id <= 4; id++ {
		if err := db.Create(&models.User{ID: id, Name: fmt.Sprint("user", id), Email: fmt.Sprintf("u%d@test.invalid", id)}).Error; err != nil {
			t.Fatal(err)
		}
	}
	for id := uint(1); id <= 3; id++ {
		owner := uint(1)
		if id == 3 {
			owner = 3
		}
		if err := db.Omit("Category", "Location", "User", "Images").Create(&models.Item{ID: id, UserID: owner, Title: fmt.Sprint("item", id), Type: models.ItemTypeFound, Status: models.ItemStatusFound}).Error; err != nil {
			t.Fatal(err)
		}
	}
	svc := NewService(NewRepository(db))
	list := func(user uint, want int) []ConversationView {
		t.Helper()
		rows, err := svc.GetConversations(user)
		if err != nil {
			t.Fatal(err)
		}
		if len(rows) != want {
			t.Fatalf("user %d: got %d conversations want %d", user, len(rows), want)
		}
		return rows
	}
	list(1, 0)
	list(2, 0)
	list(3, 0)
	list(4, 0)
	var before int64
	db.Model(&models.ChatConversation{}).Count(&before)
	if before != 0 {
		t.Fatal("reading inbox created chats")
	}
	draft, err := svc.GetOrCreateConversation(2, CreateConversationDTO{ItemID: 1, RecipientID: 1})
	if err != nil {
		t.Fatal(err)
	}
	if draft.Recipient.ID != 1 {
		t.Fatal("wrong recipient")
	}
	for i := 0; i < 3; i++ {
		again, err := svc.GetOrCreateConversation(2, CreateConversationDTO{ItemID: 1, RecipientID: 1})
		if err != nil || again.ID != draft.ID {
			t.Fatal("modal polling duplicated draft", err)
		}
	}
	list(1, 0)
	list(2, 0)
	if _, err := svc.GetOrCreateConversation(3, CreateConversationDTO{ItemID: 1, RecipientID: 4}); err != ErrForbidden {
		t.Fatal("unrelated recipient accepted", err)
	}
	other, err := svc.GetOrCreateConversation(4, CreateConversationDTO{ItemID: 3, RecipientID: 3})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.SendMessage(4, other.ID, SendMessageDTO{Text: "private pair"}); err != nil {
		t.Fatal(err)
	}
	list(1, 0)
	list(2, 0)
	list(3, 1)
	list(4, 1)
	if _, err := svc.GetConversation(3, draft.ID); err != ErrForbidden {
		t.Fatal("outsider read", err)
	}
	if _, err := svc.SendMessage(3, draft.ID, SendMessageDTO{Text: "intrusion"}); err != ErrForbidden {
		t.Fatal("outsider send", err)
	}
	image, err := svc.SendMessage(2, draft.ID, SendMessageDTO{ImageURL: "https://example.invalid/image.png"})
	if err != nil {
		t.Fatal(err)
	}
	rows := list(1, 1)
	if rows[0].Recipient.ID != 2 || rows[0].UnreadCount != 1 || rows[0].LastMessage.Image == "" {
		t.Fatal("image/recipient/unread lost")
	}
	list(2, 1)
	if err := svc.SetArchived(1, draft.ID, true); err != nil {
		t.Fatal(err)
	}
	if err := svc.SetUnread(1, draft.ID, true); err != nil {
		t.Fatal(err)
	}
	if err := svc.Recall(2, draft.ID, image.ID); err != nil {
		t.Fatal(err)
	}
	rows = list(1, 1)
	if !rows[0].Archived || !rows[0].ManualUnread || rows[0].LastMessage.RecalledAt == nil {
		t.Fatal("archive/unread/recall hidden")
	}
	if err := svc.DeleteConversation(1, draft.ID); err != nil {
		t.Fatal(err)
	}
	list(1, 0)
	list(2, 1)
	// Avoid clock precision issues while checking the existing per-user deletion semantics.
	time.Sleep(time.Millisecond)
	if _, err := svc.SendMessage(2, draft.ID, SendMessageDTO{Text: "new message"}); err != nil {
		t.Fatal(err)
	}
	list(1, 1)
	list(2, 1)
	list(3, 1)
	list(4, 1)
	var count int64
	db.Model(&models.ChatConversation{}).Count(&count)
	if count != 2 {
		t.Fatalf("inbox enumerated unchatted items: %d", count)
	}
}
