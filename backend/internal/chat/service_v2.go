package chat

import (
	"strings"
	"unifind-dntu/internal/models"
)

func (s *service) SetPinned(userID, conversationID uint, value bool) error {
	if _, err := s.authorize(userID, conversationID); err != nil {
		return err
	}
	return s.repo.SetPreference(conversationID, userID, "pinned", value)
}

func (s *service) SetUnread(userID, conversationID uint, value bool) error {
	if _, err := s.authorize(userID, conversationID); err != nil {
		return err
	}
	if !value {
		return s.MarkRead(userID, conversationID)
	}
	return s.repo.SetPreference(conversationID, userID, "manual_unread", true)
}

func (s *service) visibleMessage(conversation *models.ChatConversation, userID, messageID uint) (*models.ChatMessage, error) {
	message, err := s.repo.FindMessage(messageID)
	if err != nil {
		return nil, err
	}
	deletedAt := conversation.DeletedByBAt
	if conversation.ParticipantA == userID {
		deletedAt = conversation.DeletedByAAt
	}
	if message.ConversationID != conversation.ID || (deletedAt != nil && !message.CreatedAt.After(*deletedAt)) {
		return nil, ErrInvalidChat
	}
	if message.RecalledAt != nil {
		return nil, ErrInvalidChat
	}
	return message, nil
}

func (s *service) Recall(userID, conversationID, messageID uint) error {
	conversation, err := s.authorize(userID, conversationID)
	if err != nil {
		return err
	}
	message, err := s.repo.FindMessage(messageID)
	if err != nil {
		return err
	}
	if message.ConversationID != conversation.ID || message.SenderID != userID {
		return ErrForbidden
	}
	return s.repo.RecallMessage(message)
}

func (s *service) Forward(userID, conversationID uint, dto ForwardMessageDTO) (*MessageView, error) {
	if _, err := s.authorize(userID, conversationID); err != nil {
		return nil, err
	}
	source, err := s.authorize(userID, dto.SourceConversationID)
	if err != nil {
		return nil, err
	}
	// Retry succeeds without re-sending even after source recall.
	if id := strings.TrimSpace(dto.ClientMessageID); id != "" {
		if len(id) > 128 {
			return nil, ErrInvalidChat
		}
		existing, err := s.repo.FindClientMessage(conversationID, userID, id)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			view := messageToView(*existing, existing.Sender)
			return &view, nil
		}
	}
	message, err := s.visibleMessage(source, userID, dto.MessageID)
	if err != nil {
		return nil, err
	}
	return s.sendMessage(userID, conversationID, SendMessageDTO{Text: message.Text, ImageURL: message.ImageURL, ClientMessageID: dto.ClientMessageID}, &message.ID)
}

func (s *service) Report(userID, conversationID uint, reason string) (*models.ChatReport, error) {
	if _, err := s.authorize(userID, conversationID); err != nil {
		return nil, err
	}
	reason = strings.TrimSpace(reason)
	if reason == "" || len([]rune(reason)) > 2000 {
		return nil, ErrInvalidChat
	}
	report := &models.ChatReport{ConversationID: conversationID, ReporterID: userID, Reason: reason}
	if err := s.repo.CreateReport(report); err != nil {
		return nil, err
	}
	return report, nil
}
