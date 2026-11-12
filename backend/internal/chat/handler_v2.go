package chat

import (
	"net/http"
	"strconv"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

func (h *Handler) SetPinned(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var dto struct {
		Pinned *bool `json:"pinned" binding:"required"`
	}
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.service.SetPinned(c.MustGet("user_id").(uint), id, *dto.Pinned); err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Pin updated", nil)
}

func (h *Handler) SetUnread(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var dto struct {
		Unread *bool `json:"unread" binding:"required"`
	}
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.service.SetUnread(c.MustGet("user_id").(uint), id, *dto.Unread); err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Unread updated", nil)
}

func (h *Handler) Recall(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	messageID, err := strconv.ParseUint(c.Param("messageId"), 10, 32)
	if err != nil || messageID == 0 {
		response.Error(c, http.StatusBadRequest, "Invalid message ID")
		return
	}
	if err := h.service.Recall(c.MustGet("user_id").(uint), id, uint(messageID)); err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Message recalled", nil)
}

func (h *Handler) Forward(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var dto ForwardMessageDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	message, err := h.service.Forward(c.MustGet("user_id").(uint), id, dto)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusCreated, "Message forwarded", message)
}

func (h *Handler) Report(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var dto struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	report, err := h.service.Report(c.MustGet("user_id").(uint), id, dto.Reason)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Success(c, http.StatusCreated, "Chat reported", report)
}
