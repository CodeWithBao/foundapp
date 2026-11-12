package chat

import (
	"errors"
	"time"
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository interface {
	FindMessage(id uint) (*models.ChatMessage, error)
	FindClientMessage(conversationID, senderID uint, clientID string) (*models.ChatMessage, error)
	SetPreference(conversationID, userID uint, preference string, value bool) error
	RecallMessage(message *models.ChatMessage) error
	CreateReport(report *models.ChatReport) error
	FindItem(id uint) (*models.Item, error)
	FindUser(id uint) (*models.User, error)
	FindConversation(itemID, participantA, participantB uint) (*models.ChatConversation, error)
	FindConversationByID(id uint) (*models.ChatConversation, error)
	CreateConversation(conversation *models.ChatConversation) error
	FindConversationsByUser(userID uint) ([]models.ChatConversation, error)
	FindMessages(conversationID uint) ([]models.ChatMessage, error)
	CreateMessage(conversation *models.ChatConversation, message *models.ChatMessage, notification *models.Notification, sender *models.User) error
	MarkMessagesRead(conversationID, currentUserID uint, readAt time.Time) error
	SetBlocked(conversationID, currentUserID uint, blocked bool) error
	SetConversationState(conversationID, currentUserID uint, archived *bool, deletedAt *time.Time) error
}

type repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &repository{db: db} }

func preloadConversation(query *gorm.DB) *gorm.DB {
	return query.
		Preload("Item").Preload("Item.Images").Preload("Item.Location").
		Preload("UserA").Preload("UserB")
}

func (r *repository) FindItem(id uint) (*models.Item, error) {
	var item models.Item
	if err := r.db.Preload("Images").Preload("Location").First(&item, id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *repository) FindUser(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *repository) FindConversation(itemID, participantA, participantB uint) (*models.ChatConversation, error) {
	var conversation models.ChatConversation
	err := preloadConversation(r.db).
		Where("item_id = ? AND participant_a = ? AND participant_b = ?", itemID, participantA, participantB).
		First(&conversation).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &conversation, err
}

func (r *repository) FindConversationByID(id uint) (*models.ChatConversation, error) {
	var conversation models.ChatConversation
	if err := preloadConversation(r.db).First(&conversation, id).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *repository) CreateConversation(conversation *models.ChatConversation) error {
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(conversation).Error
}

func (r *repository) FindConversationsByUser(userID uint) ([]models.ChatConversation, error) {
	var conversations []models.ChatConversation
	err := preloadConversation(r.db).
		Where("participant_a = ? OR participant_b = ?", userID, userID).
		Order("last_message_at DESC, updated_at DESC").
		Find(&conversations).Error
	return conversations, err
}

func (r *repository) FindMessages(conversationID uint) ([]models.ChatMessage, error) {
	var messages []models.ChatMessage
	err := r.db.Preload("Sender").Where("conversation_id = ?", conversationID).
		Order("created_at ASC").Find(&messages).Error
	return messages, err
}

func (r *repository) CreateMessage(conversation *models.ChatConversation, message *models.ChatMessage, notification *models.Notification, sender *models.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Lock referenced content through insert to serialize forward/reply with recall.
		for _, id := range []*uint{message.ReplyToID, message.ForwardSourceID} {
			if id == nil {
				continue
			}
			var source models.ChatMessage
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&source, *id).Error; err != nil {
				return err
			}
			if source.RecalledAt != nil {
				return ErrInvalidChat
			}
		}
		query := tx.Omit("Sender")
		if message.ClientMessageID != nil {
			query = query.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "conversation_id"}, {Name: "sender_id"}, {Name: "client_message_id"}}, DoNothing: true})
		}
		result := query.Create(message)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return tx.Where("conversation_id = ? AND sender_id = ? AND client_message_id = ?", message.ConversationID, message.SenderID, *message.ClientMessageID).First(message).Error
		}
		if sender != nil {
			message.Sender = *sender
		}
		if err := tx.Model(conversation).Updates(map[string]interface{}{
			"last_message_at": message.CreatedAt,
			"updated_at":      message.CreatedAt,
		}).Error; err != nil {
			return err
		}
		if notification != nil {
			return tx.Create(notification).Error
		}
		return nil
	})
}

func (r *repository) MarkMessagesRead(conversationID, currentUserID uint, readAt time.Time) error {
	return r.db.Model(&models.ChatMessage{}).
		Where("conversation_id = ? AND sender_id <> ? AND read_at IS NULL", conversationID, currentUserID).
		Update("read_at", readAt).Error
}

func (r *repository) SetConversationState(conversationID, currentUserID uint, archived *bool, deletedAt *time.Time) error {
	var conversation models.ChatConversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}
	suffix := "b"
	if conversation.ParticipantA == currentUserID {
		suffix = "a"
	} else if conversation.ParticipantB != currentUserID {
		return ErrForbidden
	}
	updates := map[string]interface{}{}
	if archived != nil {
		updates["archived_by_"+suffix] = *archived
	}
	if deletedAt != nil {
		updates["deleted_by_"+suffix+"_at"] = deletedAt
		updates["archived_by_"+suffix] = false
	}
	return r.db.Model(&conversation).Updates(updates).Error
}

func (r *repository) SetBlocked(conversationID, currentUserID uint, blocked bool) error {
	var conversation models.ChatConversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}
	column := "blocked_by_b"
	if conversation.ParticipantA == currentUserID {
		column = "blocked_by_a"
	}
	return r.db.Model(&conversation).Update(column, blocked).Error
}
