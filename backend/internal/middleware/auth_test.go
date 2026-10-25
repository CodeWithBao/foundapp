package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"unifind-dntu/internal/middleware"
	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func TestRequireRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userRole       models.Role
		allowedRoles   []models.Role
		expectedStatus int
	}{
		{
			name:           "Admin accessing Admin route -> Allowed",
			userRole:       models.RoleAdmin,
			allowedRoles:   []models.Role{models.RoleAdmin},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Staff accessing Staff/Admin route -> Allowed",
			userRole:       models.RoleStaff,
			allowedRoles:   []models.Role{models.RoleStaff, models.RoleAdmin},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "User accessing Admin route -> Forbidden 403",
			userRole:       models.RoleUser,
			allowedRoles:   []models.Role{models.RoleAdmin},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "User accessing Staff route -> Forbidden 403",
			userRole:       models.RoleUser,
			allowedRoles:   []models.Role{models.RoleStaff, models.RoleAdmin},
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.GET("/protected", func(c *gin.Context) {
				c.Set("role", tt.userRole)
				c.Next()
			}, middleware.RequireRole(tt.allowedRoles...), func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func TestAuthRequired(t *testing.T) {
	gin.SetMode(gin.TestMode)

	validUser := &models.User{
		ID:        1,
		Email:     "student@dntu.edu.vn",
		Role:      models.RoleUser,
		CreatedAt: time.Now(),
	}

	token, err := jwt.GenerateToken(validUser)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	r := gin.New()
	r.GET("/auth-only", middleware.AuthRequired(), func(c *gin.Context) {
		c.String(http.StatusOK, "AUTHENTICATED")
	})

	// Case 1: Valid token
	reqValid, _ := http.NewRequest(http.MethodGet, "/auth-only", nil)
	reqValid.Header.Set("Authorization", "Bearer "+token)
	wValid := httptest.NewRecorder()
	r.ServeHTTP(wValid, reqValid)
	if wValid.Code != http.StatusOK {
		t.Errorf("Expected 200, got %d", wValid.Code)
	}

	// Case 2: Missing header
	reqMissing, _ := http.NewRequest(http.MethodGet, "/auth-only", nil)
	wMissing := httptest.NewRecorder()
	r.ServeHTTP(wMissing, reqMissing)
	if wMissing.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401, got %d", wMissing.Code)
	}

	// Case 3: Invalid token
	reqInvalid, _ := http.NewRequest(http.MethodGet, "/auth-only", nil)
	reqInvalid.Header.Set("Authorization", "Bearer invalid.fake.token")
	wInvalid := httptest.NewRecorder()
	r.ServeHTTP(wInvalid, reqInvalid)
	if wInvalid.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401, got %d", wInvalid.Code)
	}
}
