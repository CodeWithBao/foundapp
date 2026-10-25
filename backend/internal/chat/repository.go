package chat

import (
	"errors"
	"time"
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository interface {
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
		if err := tx.Create(message).Error; err != nil {
			return err
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
