package chat

import (
	"errors"
	"testing"
	"time"
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

func (f *fakeRepository) FindMessage(id uint) (*models.ChatMessage, error) {
	for _, message := range f.messages {
		if message.ID == id {
			m := message
			return &m, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
}
func (f *fakeRepository) FindClientMessage(conversationID, senderID uint, clientID string) (*models.ChatMessage, error) {
	for _, message := range f.messages {
		if message.ConversationID == conversationID && message.SenderID == senderID && message.ClientMessageID != nil && *message.ClientMessageID == clientID {
			m := message
			return &m, nil
		}
	}
	return nil, nil
}
func (f *fakeRepository) SetPreference(_ uint, userID uint, preference string, value bool) error {
	c := f.conversation
	if preference == "pinned" {
		if c.ParticipantA == userID {
			c.PinnedByA = value
		} else {
			c.PinnedByB = value
		}
	} else {
		if c.ParticipantA == userID {
			c.ManualUnreadByA = value
		} else {
			c.ManualUnreadByB = value
		}
	}
	return nil
}
func (f *fakeRepository) RecallMessage(message *models.ChatMessage) error {
	now := time.Now()
	ids := map[uint]bool{message.ID: true}
	for i := range f.messages {
		m := &f.messages[i]
		if ids[m.ID] || (m.ForwardSourceID != nil && ids[*m.ForwardSourceID]) {
			m.Text = ""
			m.ImageURL = ""
			m.RecalledAt = &now
			ids[m.ID] = true
		}
	}
	return nil
}
func (f *fakeRepository) CreateReport(report *models.ChatReport) error { report.ID = 1; return nil }

func TestChatV2PermissionsAndPrivatePreferences(t *testing.T) {
	f := newFakeRepository()
	s := NewService(f)
	c, err := s.GetOrCreateConversation(1, CreateConversationDTO{ItemID: 7, RecipientID: 2})
	if err != nil {
		t.Fatal(err)
	}
	for _, action := range []func() error{
		func() error { return s.SetPinned(3, c.ID, true) },
		func() error { return s.SetUnread(3, c.ID, true) },
		func() error { return s.Recall(3, c.ID, 1) },
		func() error { _, e := s.Report(3, c.ID, "spam"); return e },
		func() error {
			_, e := s.Forward(3, c.ID, ForwardMessageDTO{MessageID: 1, SourceConversationID: c.ID})
			return e
		},
	} {
		if !errors.Is(action(), ErrForbidden) {
			t.Fatal("outsider authorized")
		}
	}
	if err := s.SetPinned(1, c.ID, true); err != nil {
		t.Fatal(err)
	}
	if err := s.SetUnread(1, c.ID, true); err != nil {
		t.Fatal(err)
	}
	own, _ := s.GetConversation(1, c.ID)
	other, _ := s.GetConversation(2, c.ID)
	if !own.Pinned || !own.ManualUnread || other.Pinned || other.ManualUnread {
		t.Fatal("private preferences leaked")
	}
	if err := s.MarkRead(1, c.ID); err != nil {
		t.Fatal(err)
	}
	own, _ = s.GetConversation(1, c.ID)
	if own.ManualUnread {
		t.Fatal("read did not clear manual unread")
	}
	if _, err := s.Report(1, c.ID, "  "); err == nil {
		t.Fatal("empty report accepted")
	}
	report, err := s.Report(1, c.ID, " spam ")
	if err != nil || report.Reason != "spam" || report.ReporterID != 1 {
		t.Fatalf("report: %+v %v", report, err)
	}
}

func TestChatV2IdempotencyReplyForwardRecall(t *testing.T) {
	f := newFakeRepository()
	s := NewService(f)
	c, _ := s.GetOrCreateConversation(1, CreateConversationDTO{ItemID: 7, RecipientID: 2})
	first, err := s.SendMessage(1, c.ID, SendMessageDTO{Text: "secret", ImageURL: "secret-image", ClientMessageID: "retry"})
	if err != nil {
		t.Fatal(err)
	}
	duplicate, err := s.SendMessage(1, c.ID, SendMessageDTO{Text: "different", ClientMessageID: "retry"})
	if err != nil || duplicate.ID != first.ID || len(f.messages) != 1 {
		t.Fatal("duplicate inserted")
	}
	invalid := uint(500)
	if _, err := s.SendMessage(1, c.ID, SendMessageDTO{Text: "reply", ReplyToID: &invalid}); err == nil {
		t.Fatal("missing reply accepted")
	}
	id := first.ID
	if _, err := s.SendMessage(2, c.ID, SendMessageDTO{Text: "reply", ReplyToID: &id}); err != nil {
		t.Fatal(err)
	}
	forwarded, err := s.Forward(2, c.ID, ForwardMessageDTO{MessageID: id, SourceConversationID: c.ID})
	if err != nil || !forwarded.Forwarded {
		t.Fatalf("forward: %+v %v", forwarded, err)
	}
	if err := s.Recall(2, c.ID, id); !errors.Is(err, ErrForbidden) {
		t.Fatal("non-sender recalled")
	}
	if err := s.Recall(1, c.ID, id); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Forward(1, c.ID, ForwardMessageDTO{MessageID: id, SourceConversationID: c.ID}); err == nil {
		t.Fatal("recalled forwarded")
	}
	view, _ := s.GetConversation(1, c.ID)
	for _, m := range view.Messages {
		if m.RecalledAt != nil && (m.Text != "" || m.Image != "") {
			t.Fatal("recall leaked")
		}
	}
}

func TestChatV2RejectsCrossConversationAndDeletedReferences(t *testing.T) {
	f := newFakeRepository()
	svc := NewService(f)
	c, _ := svc.GetOrCreateConversation(1, CreateConversationDTO{ItemID: 7, RecipientID: 2})
	id := uint(42)
	now := time.Now()
	f.messages = []models.ChatMessage{{ID: id, ConversationID: 999, SenderID: 1, Text: "private", CreatedAt: now.Add(-time.Hour)}}
	if _, err := svc.SendMessage(1, c.ID, SendMessageDTO{Text: "reply", ReplyToID: &id}); err == nil {
		t.Fatal("cross-conversation reply accepted")
	}
	if _, err := svc.Forward(1, c.ID, ForwardMessageDTO{MessageID: id, SourceConversationID: c.ID}); err == nil {
		t.Fatal("source mismatch accepted")
	}
	f.messages[0].ConversationID = c.ID
	f.conversation.DeletedByAAt = &now
	if _, err := svc.SendMessage(1, c.ID, SendMessageDTO{Text: "reply", ReplyToID: &id}); err == nil {
		t.Fatal("deleted reply accepted")
	}
	if _, err := svc.Forward(1, c.ID, ForwardMessageDTO{MessageID: id, SourceConversationID: c.ID}); err == nil {
		t.Fatal("deleted forward accepted")
	}
	if _, err := svc.Forward(1, c.ID, ForwardMessageDTO{MessageID: id, SourceConversationID: 999}); err == nil {
		t.Fatal("unauthorized source accepted")
	}
}
