package chatbot

import (
	"net/http"
	"os"

	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type ChatbotHandler struct {
	chatbotService ChatbotService
}

func NewChatbotHandler(chatbotService ChatbotService) *ChatbotHandler {
	return &ChatbotHandler{chatbotService: chatbotService}
}

func (h *ChatbotHandler) RegisterRoutes(rg *gin.RouterGroup, optionalAuth gin.HandlerFunc) {
	group := rg.Group("/chatbot")
	if optionalAuth != nil {
		group.Use(optionalAuth)
	}

	group.POST("/message", h.SendMessage)
	group.GET("/status", h.GetStatus)
}

func (h *ChatbotHandler) SendMessage(c *gin.Context) {
	var req ChatRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Dữ liệu tin nhắn không hợp lệ")
		return
	}

	res, err := h.chatbotService.SendMessage(c.Request.Context(), req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Lỗi khi xử lý tin nhắn")
		return
	}

	response.Success(c, http.StatusOK, "Thành công", res)
}

func (h *ChatbotHandler) GetStatus(c *gin.Context) {
	apiKey := os.Getenv("CHATBOT_API_KEY")
	provider := os.Getenv("CHATBOT_AI_PROVIDER")
	if provider == "" {
		provider = "gemini"
	}
	model := os.Getenv("CHATBOT_MODEL")
	if model == "" {
		if provider == "openai" {
			model = "gpt-4o-mini"
		} else {
			model = "gemini-1.5-flash"
		}
	}

	response.Success(c, http.StatusOK, "Chatbot status retrieved", gin.H{
		"configured": apiKey != "",
		"provider":   provider,
		"model":      model,
	})
}
