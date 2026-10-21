package chat

import (
	"errors"
	"net/http"
	"strconv"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct{ service Service }

func NewHandler(service Service) *Handler { return &Handler{service: service} }

func (h *Handler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, sendRateLimit gin.HandlerFunc) {
	group := r.Group("/chats")
	group.Use(authMiddleware)
	{
		group.GET("", h.GetConversations)
		group.POST("", h.CreateConversation)
		group.GET("/:id", h.GetConversation)
		if sendRateLimit != nil {
			group.POST("/:id/messages", sendRateLimit, h.SendMessage)
		} else {
			group.POST("/:id/messages", h.SendMessage)
		}
		group.PUT("/:id/read", h.MarkRead)
		group.PUT("/:id/block", h.SetBlocked)
	}
}

func (h *Handler) CreateConversation(c *gin.Context) {
	var dto CreateConversationDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	conversation, err := h.service.GetOrCreateConversation(c.MustGet("user_id").(uint), dto)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Conversation ready", conversation)
}

func (h *Handler) GetConversations(c *gin.Context) {
	conversations, err := h.service.GetConversations(c.MustGet("user_id").(uint))
	if err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Conversations retrieved", conversations)
}

func (h *Handler) GetConversation(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	conversation, err := h.service.GetConversation(c.MustGet("user_id").(uint), id)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Conversation retrieved", conversation)
}

func (h *Handler) SendMessage(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var dto SendMessageDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	message, err := h.service.SendMessage(c.MustGet("user_id").(uint), id, dto)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusCreated, "Message sent", message)
}

func (h *Handler) MarkRead(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	if err := h.service.MarkRead(c.MustGet("user_id").(uint), id); err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Messages marked as read", nil)
}

func (h *Handler) SetBlocked(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var dto SetBlockDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.service.SetBlocked(c.MustGet("user_id").(uint), id, dto.Blocked); err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Conversation block state updated", nil)
}

func parseID(c *gin.Context) (uint, bool) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid conversation ID")
		return 0, false
	}
	return uint(id64), true
}

func handleError(c *gin.Context, err error) {
	status := http.StatusBadRequest
	switch {
	case errors.Is(err, ErrForbidden):
		status = http.StatusForbidden
	case IsNotFound(err):
		status = http.StatusNotFound
	case errors.Is(err, ErrConversationBan), errors.Is(err, ErrItemClosed):
		status = http.StatusConflict
	}
	response.Error(c, status, err.Error())
}
