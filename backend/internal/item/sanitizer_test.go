package item

import (
	"net/http/httptest"
	"testing"

	"unifind-dntu/internal/models"

	"github.com/gin-gonic/gin"
)

func TestMaskPhone(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		input    string
		expected string
	}{
		{"", ""},
		{"0912345678", "0912****78"},
		{"0123456", "0123****56"},
		{"12345", "12****"},
		{"12", "1****"},
	}

	for _, tt := range tests {
		got := maskPhone(tt.input)
		if got != tt.expected {
			t.Errorf("maskPhone(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestMaskEmail(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"", ""},
		{"user@dntu.edu.vn", "us***@dntu.edu.vn"},
		{"a@domain.com", "a***@domain.com"},
		{"ab@domain.com", "a***@domain.com"},
		{"invalid-email", "***"},
	}

	for _, tt := range tests {
		got := maskEmail(tt.input)
		if got != tt.expected {
			t.Errorf("maskEmail(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestSanitizeItem(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ItemHandler{}

	sampleItem := func() *models.Item {
		return &models.Item{
			ID:     1,
			UserID: 10,
			User: models.User{
				ID:        10,
				Name:      "Nguyen Van A",
				Email:     "vana@dntu.edu.vn",
				Phone:     "0912345678",
				StudentID: "2080601234",
			},
		}
	}

	t.Run("Anonymous viewer - PII masked", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		item := sampleItem()
		sanitized := h.sanitizeItem(c, item)

		if sanitized.User.Phone == "0912345678" || sanitized.User.Phone != "0912****78" {
			t.Errorf("Phone not properly masked: %s", sanitized.User.Phone)
		}
		if sanitized.User.StudentID != "" {
			t.Errorf("StudentID should be hidden, got %s", sanitized.User.StudentID)
		}
		if sanitized.User.Email == "vana@dntu.edu.vn" {
			t.Errorf("Email not properly masked: %s", sanitized.User.Email)
		}
	})

	t.Run("Other user viewer - PII masked", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", uint(99))
		c.Set("role", models.RoleUser)

		item := sampleItem()
		sanitized := h.sanitizeItem(c, item)

		if sanitized.User.StudentID != "" {
			t.Errorf("StudentID should be hidden for other student, got %s", sanitized.User.StudentID)
		}
		if sanitized.User.Phone != "0912****78" {
			t.Errorf("Phone not masked: %s", sanitized.User.Phone)
		}
	})

	t.Run("Owner viewer - PII preserved", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", uint(10))
		c.Set("role", models.RoleUser)

		item := sampleItem()
		sanitized := h.sanitizeItem(c, item)

		if sanitized.User.Phone != "0912345678" {
			t.Errorf("Owner phone should be intact, got %s", sanitized.User.Phone)
		}
		if sanitized.User.StudentID != "2080601234" {
			t.Errorf("Owner StudentID should be intact, got %s", sanitized.User.StudentID)
		}
		if sanitized.User.Email != "vana@dntu.edu.vn" {
			t.Errorf("Owner email should be intact, got %s", sanitized.User.Email)
		}
	})

	t.Run("Admin viewer - PII preserved", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", uint(999))
		c.Set("role", models.RoleAdmin)

		item := sampleItem()
		sanitized := h.sanitizeItem(c, item)

		if sanitized.User.Phone != "0912345678" {
			t.Errorf("Admin should see full phone, got %s", sanitized.User.Phone)
		}
		if sanitized.User.StudentID != "2080601234" {
			t.Errorf("Admin should see full StudentID, got %s", sanitized.User.StudentID)
		}
	})
}
