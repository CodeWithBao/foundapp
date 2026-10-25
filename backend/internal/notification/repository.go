package notification

import (
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type NotificationRepository interface {
	FindByUserID(userID uint) ([]models.Notification, error)
	MarkAsRead(id uint, userID uint) error
	MarkAllAsRead(userID uint) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) FindByUserID(userID uint) ([]models.Notification, error) {
	var list []models.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&list).Error
	return list, err
}

func (r *notificationRepository) MarkAsRead(id uint, userID uint) error {
	return r.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error
}

func (r *notificationRepository) MarkAllAsRead(userID uint) error {
	return r.db.Model(&models.Notification{}).
		Where("user_id = ?", userID).
		Update("is_read", true).Error
}
