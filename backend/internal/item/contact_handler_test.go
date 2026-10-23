package item

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"unifind-dntu/internal/models"

	"github.com/gin-gonic/gin"
)

func TestGetItemContactRequiresAuthenticationAndReturnsMinimalPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := newMockItemRepo()
	repo.items[7] = &models.Item{
		ID:     7,
		UserID: 10,
		User: models.User{
			ID:           10,
			Name:         "Nguyen Van A",
			Phone:        "0912345678",
			Email:        "student@dntu.edu.vn",
			StudentID:    "2080601234",
			PasswordHash: "secret-hash",
		},
	}
	handler := NewItemHandler(NewItemService(repo, nil))

	t.Run("anonymous request is rejected", func(t *testing.T) {
		writer := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(writer)
		context.Params = gin.Params{{Key: "id", Value: "7"}}

		handler.GetItemContact(context)
		if writer.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", writer.Code)
		}
	})

	t.Run("authenticated response contains only phone and email", func(t *testing.T) {
		writer := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(writer)
		context.Params = gin.Params{{Key: "id", Value: "7"}}
		context.Set("user_id", uint(99))

		handler.GetItemContact(context)
		if writer.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", writer.Code, writer.Body.String())
		}

		var payload struct {
			Data map[string]interface{} `json:"data"`
		}
		if err := json.Unmarshal(writer.Body.Bytes(), &payload); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if len(payload.Data) != 2 || payload.Data["phone"] != "0912345678" || payload.Data["email"] != "student@dntu.edu.vn" {
			t.Fatalf("endpoint exposed unexpected fields: %#v", payload.Data)
		}
	})
}
