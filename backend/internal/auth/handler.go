package auth

import (
	"errors"
	"net/http"

	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService AuthService
}

func NewAuthHandler(authService AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var dto LoginDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.authService.Login(dto)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Login successful", res)
}

func (h *AuthHandler) Register(c *gin.Context) {
	var dto RegisterDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.authService.Register(dto)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Registration successful", res)
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	var dto GoogleLoginDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload: credential or id_token is required")
		return
	}

	// Accept both "credential" and "id_token" fields
	token := dto.Credential
	if token == "" {
		token = dto.IdToken
	}
	if token == "" {
		response.Error(c, http.StatusBadRequest, "credential or id_token is required")
		return
	}

	res, err := h.authService.GoogleLogin(c.Request.Context(), token)
	if err != nil {
		if errors.Is(err, ErrAccountAlreadyExists) || err.Error() == "ACCOUNT_ALREADY_EXISTS" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error":   "ACCOUNT_ALREADY_EXISTS",
				"message": "An account with this email already exists with password authentication. Please login using email and password.",
			})
			return
		}
		// Token verification failures -> 401
		msg := err.Error()
		if msg == "invalid or expired Google token" || msg == "empty token" || msg == "email not verified" || msg == "invalid audience" {
			response.Error(c, http.StatusUnauthorized, msg)
			return
		}
		response.Error(c, http.StatusBadRequest, msg)
		return
	}

	response.Success(c, http.StatusOK, "Google login successful", res)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := userIDVal.(uint)
	user, err := h.authService.GetProfile(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}

	response.Success(c, http.StatusOK, "Profile retrieved successfully", user)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto ChangePasswordDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID := userIDVal.(uint)
	if err := h.authService.ChangePassword(userID, dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Password changed successfully", nil)
}

func (h *AuthHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", h.Login)
		authGroup.POST("/register", h.Register)
		authGroup.POST("/google", h.GoogleLogin)
		authGroup.GET("/me", authMiddleware, h.GetMe)
		authGroup.POST("/change-password", authMiddleware, h.ChangePassword)
	}
}
