package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"unifind-dntu/internal/middleware"

	"github.com/gin-gonic/gin"
)

func TestProxySecretMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		securityEnable string
		secretVal      string
		headerSecret   string
		expectedStatus int
	}{
		{
			name:           "Disabled proxy security allows all",
			securityEnable: "false",
			secretVal:      "secret123",
			headerSecret:   "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Enabled proxy security with valid secret succeeds",
			securityEnable: "true",
			secretVal:      "valid_token_xyz_999",
			headerSecret:   "valid_token_xyz_999",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Enabled proxy security with missing header fails 403",
			securityEnable: "true",
			secretVal:      "valid_token_xyz_999",
			headerSecret:   "",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Enabled proxy security with wrong header fails 403",
			securityEnable: "true",
			secretVal:      "valid_token_xyz_999",
			headerSecret:   "wrong_token_hacker",
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("PROXY_SECURITY_ENABLED", tt.securityEnable)
			os.Setenv("ORIGIN_PROXY_SECRET", tt.secretVal)
			defer os.Unsetenv("PROXY_SECURITY_ENABLED")
			defer os.Unsetenv("ORIGIN_PROXY_SECRET")

			r := gin.New()
			r.Use(middleware.ProxySecretMiddleware())
			r.GET("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req, _ := http.NewRequest(http.MethodGet, "/test", nil)
			if tt.headerSecret != "" {
				req.Header.Set("X-Origin-Secret", tt.headerSecret)
			}

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}
