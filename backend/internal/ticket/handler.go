package ticket

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }
func (h *Handler) RegisterRoutes(r *gin.RouterGroup, auth gin.HandlerFunc) {
	g := r.Group("/tickets", auth)
	g.GET("", h.list)
	g.POST("", h.create)
	g.GET("/:id", h.get)
	g.POST("/:id/messages", h.message)
	g.PUT("/:id/status", h.status)
	g.PUT("/:id/read", h.read)
}
func (h *Handler) actor(c *gin.Context) (*models.User, bool) {
	id, ok := c.Get("user_id")
	if !ok {
		response.Error(c, 401, "Unauthorized")
		return nil, false
	}
	var u models.User
	if h.db.First(&u, id).Error != nil || u.Status != "ACTIVE" {
		response.Error(c, 403, "Access denied")
		return nil, false
	}
	return &u, true
}
func privileged(u *models.User) bool { return u.Role == models.RoleStaff || u.Role == models.RoleAdmin }
func (h *Handler) load(c *gin.Context, u *models.User) (*models.SupportTicket, bool) {
	var t models.SupportTicket
	err := h.db.Preload("Messages", func(db *gorm.DB) *gorm.DB { return db.Order("id ASC") }).First(&t, "id = ?", c.Param("id")).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(c, 404, "Ticket not found")
		} else {
			response.Error(c, 500, "Cannot load ticket")
		}
		return nil, false
	}
	if !privileged(u) && t.UserID != u.ID {
		response.Error(c, 403, "Access denied")
		return nil, false
	}
	return &t, true
}
func (h *Handler) list(c *gin.Context) {
	u, ok := h.actor(c)
	if !ok {
		return
	}
	q := h.db.Model(&models.SupportTicket{}).Preload("Messages", func(db *gorm.DB) *gorm.DB { return db.Order("id ASC") })
	if !privileged(u) {
		q = q.Where("user_id = ?", u.ID)
	}
	if s := c.Query("status"); s != "" && s != "all" {
		q = q.Where("status = ?", s)
	}
	var ts []models.SupportTicket
	if q.Order("updated_at DESC").Find(&ts).Error != nil {
		response.Error(c, 500, "Cannot load tickets")
		return
	}
	response.Success(c, 200, "Tickets retrieved", ts)
}
func (h *Handler) get(c *gin.Context) {
	u, ok := h.actor(c)
	if !ok {
		return
	}
	t, ok := h.load(c, u)
	if ok {
		response.Success(c, 200, "Ticket retrieved", t)
	}
}
func (h *Handler) create(c *gin.Context) {
	u, ok := h.actor(c)
	if !ok {
		return
	}
	var dto struct {
		Topic          string `json:"topic"`
		InitialMessage string `json:"initialMessage"`
	}
	if c.ShouldBindJSON(&dto) != nil || len(strings.TrimSpace(dto.Topic)) == 0 || len(dto.Topic) > 200 || len(dto.InitialMessage) > 5000 {
		response.Error(c, 400, "Invalid ticket content")
		return
	}
	now := time.Now()
	t := models.SupportTicket{ID: "TK-" + uuid.NewString(), UserID: u.ID, UserName: u.Name, UserEmail: u.Email, UserRole: strings.ToLower(string(u.Role)), Topic: strings.TrimSpace(dto.Topic), Status: "OPEN", UnreadByStaff: true, UnreadByAdmin: true, CreatedAt: now, UpdatedAt: now, Messages: []models.SupportTicketMessage{}}
	if text := strings.TrimSpace(dto.InitialMessage); text != "" {
		t.Messages = append(t.Messages, models.SupportTicketMessage{Sender: strings.ToLower(string(u.Role)), SenderName: u.Name, Text: text, Time: now})
	}
	if h.db.Create(&t).Error != nil {
		response.Error(c, 500, "Cannot create ticket")
		return
	}
	response.Success(c, http.StatusCreated, "Ticket created", t)
}
func (h *Handler) message(c *gin.Context) {
	u, ok := h.actor(c)
	if !ok {
		return
	}
	t, ok := h.load(c, u)
	if !ok {
		return
	}
	var dto struct {
		Text string `json:"text"`
	}
	if c.ShouldBindJSON(&dto) != nil || strings.TrimSpace(dto.Text) == "" || len(dto.Text) > 5000 {
		response.Error(c, 400, "Invalid message")
		return
	}
	if t.Status == "CLOSED" || t.Status == "RESOLVED" {
		response.Error(c, 409, "Ticket is closed")
		return
	}
	m := models.SupportTicketMessage{TicketID: t.ID, Sender: strings.ToLower(string(u.Role)), SenderName: u.Name, Text: strings.TrimSpace(dto.Text), Time: time.Now()}
	changes := map[string]interface{}{"updated_at": m.Time}
	if privileged(u) && u.ID != t.UserID {
		changes["unread_by_user"] = true
	} else {
		changes["unread_by_staff"] = true
		changes["unread_by_admin"] = true
	}
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&m).Error; err != nil {
			return err
		}
		return tx.Model(t).Updates(changes).Error
	})
	if err != nil {
		response.Error(c, 500, "Cannot save message")
		return
	}
	h.get(c)
}
func (h *Handler) status(c *gin.Context) {
	u, ok := h.actor(c)
	if !ok {
		return
	}
	t, ok := h.load(c, u)
	if !ok {
		return
	}
	var dto struct {
		Status string `json:"status"`
	}
	if c.ShouldBindJSON(&dto) != nil {
		response.Error(c, 400, "Invalid status")
		return
	}
	if !privileged(u) && dto.Status != "RESOLVED" && dto.Status != "CLOSED" {
		response.Error(c, 403, "Access denied")
		return
	}
	switch dto.Status {
	case "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED":
	default:
		response.Error(c, 400, "Invalid status")
		return
	}
	changes := map[string]interface{}{"status": dto.Status, "updated_at": time.Now()}
	if privileged(u) && u.ID != t.UserID {
		changes["unread_by_user"] = true
	} else {
		changes["unread_by_staff"] = true
		changes["unread_by_admin"] = true
	}
	if h.db.Model(t).Updates(changes).Error != nil {
		response.Error(c, 500, "Cannot update ticket")
		return
	}
	h.get(c)
}
func (h *Handler) read(c *gin.Context) {
	u, ok := h.actor(c)
	if !ok {
		return
	}
	t, ok := h.load(c, u)
	if !ok {
		return
	}
	column := "unread_by_user"
	if u.ID != t.UserID {
		if u.Role == models.RoleAdmin {
			column = "unread_by_admin"
		} else {
			column = "unread_by_staff"
		}
	}
	if h.db.Model(t).UpdateColumn(column, false).Error != nil {
		response.Error(c, 500, "Cannot mark ticket read")
		return
	}
	response.Success(c, 200, "Ticket read", nil)
}
