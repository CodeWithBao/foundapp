package chat

import (
	"errors"
	"time"
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (r *repository) FindMessage(id uint) (*models.ChatMessage, error) {
	var message models.ChatMessage
	err := r.db.Preload("Sender").First(&message, id).Error
	return &message, err
}

func (r *repository) FindClientMessage(conversationID, senderID uint, clientID string) (*models.ChatMessage, error) {
	var message models.ChatMessage
	err := r.db.Preload("Sender").Where("conversation_id = ? AND sender_id = ? AND client_message_id = ?", conversationID, senderID, clientID).First(&message).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &message, err
}

func (r *repository) SetPreference(conversationID, userID uint, preference string, value bool) error {
	if preference != "pinned" && preference != "manual_unread" {
		return ErrInvalidChat
	}
	var conversation models.ChatConversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}
	suffix := "b"
	if conversation.ParticipantA == userID {
		suffix = "a"
	} else if conversation.ParticipantB != userID {
		return ErrForbidden
	}
	return r.db.Model(&conversation).Update(preference+"_by_"+suffix, value).Error
}

func (r *repository) RecallMessage(message *models.ChatMessage) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var locked models.ChatMessage
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, message.ID).Error; err != nil {
			return err
		}
		if locked.RecalledAt != nil {
			return nil
		}
		now := time.Now()
		if err := tx.Model(&locked).Updates(map[string]interface{}{"text": "", "image_url": "", "recalled_at": now}).Error; err != nil {
			return err
		}
		// Forwards store content, replies store IDs only. Redact all descendant forwards.
		ids := []uint{locked.ID}
		for len(ids) > 0 {
			var children []models.ChatMessage
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("forward_source_id IN ?", ids).Find(&children).Error; err != nil {
				return err
			}
			if len(children) == 0 {
				break
			}
			ids = nil
			for _, child := range children {
				ids = append(ids, child.ID)
			}
			if err := tx.Model(&models.ChatMessage{}).Where("id IN ?", ids).Updates(map[string]interface{}{"text": "", "image_url": "", "recalled_at": now}).Error; err != nil {
				return err
			}
		}
		// Existing notification schema has no message FK: clear chat snippets for affected items.
		var itemIDs []uint
		if err := tx.Model(&models.ChatConversation{}).Where("id IN (?)", tx.Model(&models.ChatMessage{}).Select("conversation_id").Where("recalled_at = ?", now)).Pluck("item_id", &itemIDs).Error; err != nil {
			return err
		}
		return tx.Model(&models.Notification{}).Where("type = ? AND related_id IN ?", "chat_message", itemIDs).Update("message", "Tin nhắn đã được thu hồi").Error
	})
}

func (r *repository) CreateReport(report *models.ChatReport) error { return r.db.Create(report).Error }
