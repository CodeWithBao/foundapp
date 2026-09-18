package middleware

import (
	"crypto/subtle"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// ProxySecretMiddleware verifies that the request comes from the Cloudflare Pages Function Proxy
// by checking the X-Origin-Secret header.
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
		providedSecret := []byte(c.GetHeader("X-Origin-Secret"))

		if len(providedSecret) == 0 || subtle.ConstantTimeCompare(providedSecret, expectedSecret) != 1 {
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
