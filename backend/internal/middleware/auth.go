package middleware

import (
	"net/http"
	"strings"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/jwt"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			response.Error(c, http.StatusUnauthorized, "Authorization format must be Bearer {token}")
			c.Abort()
			return
		}

		claims, err := jwt.ValidateToken(parts[1])
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoleVal, exists := c.Get("role")
		if !exists {
			response.Error(c, http.StatusForbidden, "Access denied")
			c.Abort()
			return
		}

		userRole, ok := userRoleVal.(models.Role)
		if !ok {
			response.Error(c, http.StatusForbidden, "Invalid user role")
			c.Abort()
			return
		}

		for _, r := range roles {
			if userRole == r {
				c.Next()
				return
			}
		}

		response.Error(c, http.StatusForbidden, "Permission denied")
		c.Abort()
	}
}
