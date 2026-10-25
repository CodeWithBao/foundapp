package chat

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Hub quản lý kết nối WebSocket theo từng cuộc trò chuyện.
type Hub struct {
	mu      sync.Mutex
	clients map[uint]map[*websocket.Conn]bool
}

// Tạo Hub mới.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[uint]map[*websocket.Conn]bool),
	}
}

// Đăng ký kết nối vào cuộc trò chuyện.
func (h *Hub) Register(conversationID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[conversationID] == nil {
		h.clients[conversationID] = make(map[*websocket.Conn]bool)
	}

	h.clients[conversationID][conn] = true
}

// Xóa kết nối khỏi cuộc trò chuyện.
func (h *Hub) Unregister(conversationID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.clients[conversationID]; ok {
		delete(clients, conn)

		if len(clients) == 0 {
			delete(h.clients, conversationID)
		}
	}
}

// Phát tin nhắn đến các kết nối trong cuộc trò chuyện.
func (h *Hub) Broadcast(conversationID uint, message any) {
	h.mu.Lock()
	defer h.mu.Unlock()

	clients := h.clients[conversationID]

	for conn := range clients {
		if err := conn.WriteJSON(message); err != nil {
			conn.Close()
			delete(clients, conn)
		}
	}

	if len(clients) == 0 {
		delete(h.clients, conversationID)
	}
}

// Cấu hình WebSocket.
var websocketUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")

		switch origin {
		case "http://localhost:5173",
			"http://127.0.0.1:5173":
			return true
		default:
			return false
		}
	},
}

// WebSocket xác thực bằng ticket ngắn hạn, dùng một lần.
func (h *Handler) WebSocket(c *gin.Context) {
	conversationID, ok := parseID(c)
	if !ok {
		return
	}

	// Ticket được cấp qua API đã xác thực JWT.
	ticket := c.Query("ticket")

	currentUserID, err := h.tickets.Consume(ticket, conversationID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error": "WebSocket ticket không hợp lệ hoặc đã hết hạn",
		})
		return
	}

	// Kiểm tra lại quyền truy cập cuộc trò chuyện.
	_, err = h.service.GetConversation(currentUserID, conversationID)
	if err != nil {
		handleError(c, err)
		return
	}

	// Nâng cấp HTTP thành WebSocket sau khi xác thực.
	conn, err := websocketUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	h.hub.Register(conversationID, conn)

	defer func() {
		h.hub.Unregister(conversationID, conn)
		conn.Close()
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
