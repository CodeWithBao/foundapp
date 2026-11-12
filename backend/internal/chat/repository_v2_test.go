package chat

import (
	"fmt"
	"testing"
	"time"
	"unifind-dntu/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestRepositoryV2MigrationIdempotencyTransactionAndRecall(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{DisableForeignKeyConstraintWhenMigrating: true})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	// Simulate existing rows before nullable client IDs are introduced.
	if err := db.Exec("CREATE TABLE chat_messages (id integer PRIMARY KEY, conversation_id integer NOT NULL, sender_id integer NOT NULL, text text)").Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Exec("INSERT INTO chat_messages (id,conversation_id,sender_id,text) VALUES (1,10,1,'old'),(2,10,1,'old')").Error; err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.ChatConversation{}, &models.ChatMessage{}, &models.ChatReport{}, &models.Notification{}); err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.ChatMessage{}); err != nil {
		t.Fatal(err)
	}
	r := &repository{db: db}
	c := &models.ChatConversation{ID: 10, ItemID: 7, ParticipantA: 1, ParticipantB: 2}
	if err := db.Omit("Item", "UserA", "UserB", "Messages").Create(c).Error; err != nil {
		t.Fatal(err)
	}
	sender := &models.User{ID: 1}
	key := "retry"
	makeMessage := func() *models.ChatMessage {
		return &models.ChatMessage{ConversationID: 10, SenderID: 1, Text: "secret", ImageURL: "private", ClientMessageID: &key, CreatedAt: time.Now()}
	}
	notify := func() *models.Notification {
		return &models.Notification{UserID: 2, Type: "chat_message", RelatedID: 7, Message: "secret"}
	}
	first := makeMessage()
	if err := r.CreateMessage(c, first, notify(), sender); err != nil {
		t.Fatal(err)
	}
	duplicate := makeMessage()
	if err := r.CreateMessage(c, duplicate, notify(), sender); err != nil {
		t.Fatal(err)
	}
	var count int64
	db.Model(&models.Notification{}).Count(&count)
	if count != 1 || duplicate.ID != first.ID {
		t.Fatalf("duplicate notification/id: %d %d %d", count, first.ID, duplicate.ID)
	}
	for i := 0; i < 2; i++ {
		m := makeMessage()
		m.ClientMessageID = nil
		if err := r.CreateMessage(c, m, nil, sender); err != nil {
			t.Fatal(err)
		}
	}
	child := &models.ChatMessage{ConversationID: 10, SenderID: 2, Text: "secret", ImageURL: "private", ForwardSourceID: &first.ID}
	if err := r.CreateMessage(c, child, nil, sender); err != nil {
		t.Fatal(err)
	}
	grandchild := &models.ChatMessage{ConversationID: 10, SenderID: 1, Text: "secret", ForwardSourceID: &child.ID}
	if err := r.CreateMessage(c, grandchild, nil, sender); err != nil {
		t.Fatal(err)
	}
	if err := r.RecallMessage(first); err != nil {
		t.Fatal(err)
	}
	for _, id := range []uint{first.ID, child.ID, grandchild.ID} {
		var m models.ChatMessage
		db.First(&m, id)
		if m.RecalledAt == nil || m.Text != "" || m.ImageURL != "" {
			t.Fatalf("recall leak: %+v", m)
		}
	}
	stale := &models.ChatMessage{ConversationID: 10, SenderID: 2, Text: "secret", ForwardSourceID: &first.ID}
	if err := r.CreateMessage(c, stale, nil, sender); err == nil {
		t.Fatal("recalled source accepted")
	}
	// Force notification failure and prove message insert is rolled back.
	if err := db.Callback().Create().Before("gorm:create").Register("fail_notification", func(tx *gorm.DB) {
		if tx.Statement.Table == "notifications" {
			tx.AddError(fmt.Errorf("notification failure"))
		}
	}); err != nil {
		t.Fatal(err)
	}
	key = "rollback"
	failed := makeMessage()
	if err := r.CreateMessage(c, failed, notify(), sender); err == nil {
		t.Fatal("notification failure ignored")
	}
	db.Model(&models.ChatMessage{}).Where("client_message_id = ?", "rollback").Count(&count)
	if count != 0 {
		t.Fatal("message committed without notification")
	}
}
