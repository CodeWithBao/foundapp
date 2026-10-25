package chat

import (
	"errors"
	"net/http"
	"strconv"

	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
	hub     *Hub
	tickets *websocketTicketStore
}

// NewHandler tạo Handler mới.
func NewHandler(service Service, hub *Hub) *Handler {
	return &Handler{
		service: service,
		hub:     hub,
		tickets: newWebSocketTicketStore(),
	}
}

// RegisterRoutes đăng ký các API chat.
func (h *Handler) RegisterRoutes(
	r *gin.RouterGroup,
	authMiddleware gin.HandlerFunc,
	sendRateLimit gin.HandlerFunc,
) {
	// WebSocket tự xác thực bằng ticket dùng một lần.
	// Không áp dụng JWT middleware trực tiếp cho route này.
	wsGroup := r.Group("/chats")
	wsGroup.GET("/:id/ws", h.WebSocket)

	// Các API thông thường vẫn yêu cầu JWT.
	group := r.Group("/chats")
	group.Use(authMiddleware)

	group.GET("", h.GetConversations)
	group.POST("", h.CreateConversation)
	group.GET("/:id", h.GetConversation)

	// Chỉ người dùng đã đăng nhập mới xin được ticket.
	group.POST("/:id/ws-ticket", h.CreateWebSocketTicket)

	if sendRateLimit != nil {
		group.POST("/:id/messages", sendRateLimit, h.SendMessage)
	} else {
		group.POST("/:id/messages", h.SendMessage)
	}

	group.PUT("/:id/read", h.MarkRead)
	group.PUT("/:id/block", h.SetBlocked)
}

// CreateConversation tạo hoặc lấy cuộc trò chuyện.
func (h *Handler) CreateConversation(c *gin.Context) {
	var dto CreateConversationDTO

	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	conversation, err := h.service.GetOrCreateConversation(
		c.MustGet("user_id").(uint),
		dto,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(
		c,
		http.StatusOK,
		"Conversation ready",
		conversation,
	)
}

// GetConversations lấy danh sách cuộc trò chuyện.
func (h *Handler) GetConversations(c *gin.Context) {
	conversations, err := h.service.GetConversations(
		c.MustGet("user_id").(uint),
	)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(
		c,
		http.StatusOK,
		"Conversations retrieved",
		conversations,
	)
}

// GetConversation lấy chi tiết cuộc trò chuyện.
func (h *Handler) GetConversation(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	conversation, err := h.service.GetConversation(
		c.MustGet("user_id").(uint),
		id,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(
		c,
		http.StatusOK,
		"Conversation retrieved",
		conversation,
	)
}

// SendMessage gửi và lưu tin nhắn.
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

	message, err := h.service.SendMessage(
		c.MustGet("user_id").(uint),
		id,
		dto,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	// Phát tin nhắn realtime nếu Hub đã được khởi tạo.
	if h.hub != nil {
		h.hub.Broadcast(id, message)
	}

	response.Success(
		c,
		http.StatusCreated,
		"Message sent",
		message,
	)
}

// MarkRead đánh dấu tin nhắn đã đọc.
func (h *Handler) MarkRead(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	err := h.service.MarkRead(
		c.MustGet("user_id").(uint),
		id,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(
		c,
		http.StatusOK,
		"Messages marked as read",
		nil,
	)
}

// SetBlocked chặn hoặc bỏ chặn người dùng.
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

	err := h.service.SetBlocked(
		c.MustGet("user_id").(uint),
		id,
		dto.Blocked,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(
		c,
		http.StatusOK,
		"Conversation block state updated",
		nil,
	)
}

// CreateWebSocketTicket cấp ticket dùng một lần, có hạn 60 giây.
func (h *Handler) CreateWebSocketTicket(c *gin.Context) {
	conversationID, ok := parseID(c)
	if !ok {
		return
	}

	currentUserID := c.MustGet("user_id").(uint)

	// Kiểm tra quyền truy cập trước khi cấp ticket.
	_, err := h.service.GetConversation(currentUserID, conversationID)
	if err != nil {
		handleError(c, err)
		return
	}

	ticket, err := h.tickets.Issue(currentUserID, conversationID)
	if err != nil {
		response.Error(
			c,
			http.StatusInternalServerError,
			"Không thể tạo WebSocket ticket",
		)
		return
	}

	response.Success(
		c,
		http.StatusOK,
		"WebSocket ticket created",
		gin.H{
			"ticket":    ticket,
			"expiresIn": 60,
		},
	)
}

// parseID chuyển ID trên URL thành uint.
func parseID(c *gin.Context) (uint, bool) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(
			c,
			http.StatusBadRequest,
			"Invalid conversation ID",
		)
		return 0, false
	}

	return uint(id64), true
}

// handleError chuyển lỗi nghiệp vụ thành HTTP status.
func handleError(c *gin.Context, err error) {
	status := http.StatusBadRequest

	switch {
	case errors.Is(err, ErrForbidden):
		status = http.StatusForbidden

	case IsNotFound(err):
		status = http.StatusNotFound

	case errors.Is(err, ErrConversationBan),
		errors.Is(err, ErrItemClosed):
		status = http.StatusConflict
	}

	response.Error(c, status, err.Error())
}
