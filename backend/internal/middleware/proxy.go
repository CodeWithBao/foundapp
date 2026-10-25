package middleware

import (
	"crypto/subtle"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// isChatWebSocketUpgrade chỉ nhận diện request nâng cấp WebSocket
// đúng đường dẫn chat. Việc bỏ qua proxy secret ở đây không bỏ
// bước xác thực ticket trong chat.WebSocket.
func isChatWebSocketUpgrade(c *gin.Context) bool {
	r := c.Request

	if r.Method != http.MethodGet ||
		!strings.EqualFold(r.Header.Get("Upgrade"), "websocket") ||
		!strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade") {
		return false
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) != 6 ||
		parts[1] != "api" ||
		parts[2] != "v1" ||
		parts[3] != "chats" ||
		parts[5] != "ws" {
		return false
	}

	id, err := strconv.ParseUint(parts[4], 10, 32)
	return err == nil && id > 0
}

// ProxySecretMiddleware verifies requests from the trusted proxy.
// Only the chat WebSocket handshake is exempted because it authenticates
// through a short-lived, one-time ticket instead.
func ProxySecretMiddleware() gin.HandlerFunc {
	enabled := os.Getenv("PROXY_SECURITY_ENABLED")
	if enabled != "true" && enabled != "1" {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	secret := os.Getenv("ORIGIN_PROXY_SECRET")
	expectedSecret := []byte(secret)

	return func(c *gin.Context) {
		if isChatWebSocketUpgrade(c) {
			c.Next()
			return
		}

		providedSecret := []byte(c.GetHeader("X-Origin-Secret"))

		if len(expectedSecret) == 0 ||
			len(providedSecret) == 0 ||
			subtle.ConstantTimeCompare(providedSecret, expectedSecret) != 1 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"message": "Invalid or missing origin proxy secret",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
