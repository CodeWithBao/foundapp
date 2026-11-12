package chat

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestChatV2HTTPRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	f := newFakeRepository()
	svc := NewService(f)
	if _, err := svc.GetOrCreateConversation(1, CreateConversationDTO{ItemID: 7, RecipientID: 2}); err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	NewHandler(svc).RegisterRoutes(router.Group("/api"), func(c *gin.Context) {
		user := uint(1)
		if c.GetHeader("X-Outsider") == "true" {
			user = 3
		}
		c.Set("user_id", user)
	}, nil)
	tests := []struct {
		method, path, body string
		status             int
		outsider           bool
	}{
		{"PUT", "/api/chats/10/pin", `{"pinned":true}`, 200, false},
		{"PUT", "/api/chats/10/pin", `{"pinned":false}`, 200, false},
		{"PUT", "/api/chats/10/pin", `{}`, 400, false},
		{"PUT", "/api/chats/10/unread", `{"unread":true}`, 200, false},
		{"PUT", "/api/chats/10/unread", `{"unread":false}`, 200, false},
		{"POST", "/api/chats/10/messages", `{"text":"hello","client_message_id":"http"}`, 201, false},
		{"POST", "/api/chats/10/messages", `{"text":"retry","client_message_id":"http"}`, 201, false},
		{"POST", "/api/chats/10/forward", `{"message_id":99,"source_conversation_id":10,"client_message_id":"forward"}`, 201, false},
		{"POST", "/api/chats/10/report", `{"reason":"spam"}`, 201, false},
		{"POST", "/api/chats/10/messages/99/recall", `{}`, 200, false},
		{"POST", "/api/chats/10/messages/99/recall", `{}`, 200, false},
		{"POST", "/api/chats/10/messages/invalid/recall", `{}`, 400, false},
		{"PUT", "/api/chats/10/pin", `{"pinned":true}`, 403, true},
		{"PUT", "/api/chats/10/unread", `{"unread":true}`, 403, true},
		{"POST", "/api/chats/10/report", `{"reason":"spam"}`, 403, true},
		{"POST", "/api/chats/10/forward", `{"message_id":99,"source_conversation_id":10}`, 403, true},
		{"POST", "/api/chats/10/messages/99/recall", `{}`, 403, true},
	}
	for _, tt := range tests {
		req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
		req.Header.Set("Content-Type", "application/json")
		if tt.outsider {
			req.Header.Set("X-Outsider", "true")
		}
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != tt.status {
			t.Errorf("%s %s: got %d want %d: %s", tt.method, tt.path, w.Code, tt.status, w.Body.String())
		}
	}
}
