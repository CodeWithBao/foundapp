package chat

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

const websocketTicketTTL = 60 * time.Second

var ErrInvalidWebSocketTicket = errors.New("invalid or expired websocket ticket")

type websocketTicket struct {
	UserID         uint
	ConversationID uint
	ExpiresAt      time.Time
}

type websocketTicketStore struct {
	mu      sync.Mutex
	tickets map[string]websocketTicket
}

func newWebSocketTicketStore() *websocketTicketStore {
	return &websocketTicketStore{
		tickets: make(map[string]websocketTicket),
	}
}

func (s *websocketTicketStore) Issue(userID, conversationID uint) (string, error) {
	if userID == 0 || conversationID == 0 {
		return "", ErrInvalidWebSocketTicket
	}

	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	ticket := hex.EncodeToString(randomBytes)

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	for key, value := range s.tickets {
		if !value.ExpiresAt.After(now) {
			delete(s.tickets, key)
		}
	}

	s.tickets[ticket] = websocketTicket{
		UserID:         userID,
		ConversationID: conversationID,
		ExpiresAt:      now.Add(websocketTicketTTL),
	}

	return ticket, nil
}

func (s *websocketTicketStore) Consume(ticket string, conversationID uint) (uint, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	value, exists := s.tickets[ticket]
	if exists {
		// Ticket chỉ được dùng một lần.
		delete(s.tickets, ticket)
	}

	if !exists ||
		ticket == "" ||
		!value.ExpiresAt.After(time.Now()) ||
		value.ConversationID != conversationID {
		return 0, ErrInvalidWebSocketTicket
	}

	return value.UserID, nil
}
