package observer

import (
	"log"
	"unifind-dntu/internal/models"
	"gorm.io/gorm"
)

type EventType string

const (
	EventClaimCreated EventType = "CLAIM_CREATED"
	EventClaimUpdated EventType = "CLAIM_UPDATED"
	EventItemMatched  EventType = "ITEM_MATCHED"
)

type Event struct {
	Type      EventType
	UserID    uint
	Title     string
	Message   string
	RelatedID uint
}

type Observer interface {
	OnNotify(event Event)
}

type Subject struct {
	observers []Observer
}

func (s *Subject) Register(observer Observer) {
	s.observers = append(s.observers, observer)
}

func (s *Subject) Notify(event Event) {
	for _, observer := range s.observers {
		observer.OnNotify(event)
	}
}

type NotificationObserver struct {
	db *gorm.DB
}

func NewNotificationObserver(db *gorm.DB) *NotificationObserver {
	return &NotificationObserver{db: db}
}

func (no *NotificationObserver) OnNotify(event Event) {
	notification := models.Notification{
		UserID:    event.UserID,
		Title:     event.Title,
		Message:   event.Message,
		Type:      string(event.Type),
		RelatedID: event.RelatedID,
		IsRead:    false,
	}

	if no.db != nil {
		if err := no.db.Create(&notification).Error; err != nil {
			log.Printf("[Observer Error] Failed to create notification: %v", err)
		}
	}
}
