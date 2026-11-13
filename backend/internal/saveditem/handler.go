package saveditem

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }
func (h *Handler) RegisterRoutes(r *gin.RouterGroup, auth gin.HandlerFunc) {
	g := r.Group("/saved-items", auth, h.identity)
	g.GET("", h.list)
	g.GET("/status", h.status)
	g.PUT("/:id", h.put)
	g.DELETE("/:id", h.remove)
}

// Identity comes exclusively from the existing JWT middleware, never request data.
func (h *Handler) identity(c *gin.Context) {
	uid, ok := c.Get("user_id")
	id, valid := uid.(uint)
	if !ok || !valid || id == 0 {
		response.Error(c, 401, "Unauthorized")
		c.Abort()
		return
	}
	var count int64
	if err := h.db.WithContext(c.Request.Context()).Model(&models.User{}).Where("id = ?", id).Count(&count).Error; err != nil {
		fail(c)
		c.Abort()
		return
	}
	if count == 0 {
		response.Error(c, 401, "Unauthorized")
		c.Abort()
		return
	}
	c.Next()
}
func uid(c *gin.Context) uint { return c.MustGet("user_id").(uint) }
func fail(c *gin.Context)     { response.Error(c, 500, "Saved items operation failed") }
func parseID(s string) (uint, error) {
	n, e := strconv.ParseUint(s, 10, 32)
	if e == nil && n == 0 {
		e = strconv.ErrSyntax
	}
	return uint(n), e
}
func pathID(c *gin.Context) (uint, bool) {
	id, e := parseID(c.Param("id"))
	if e != nil {
		response.Error(c, 400, "Invalid item ID")
		return 0, false
	}
	return id, true
}
func (h *Handler) put(c *gin.Context) {
	id, ok := pathID(c)
	if !ok {
		return
	}
	// INSERT SELECT avoids inserting an unavailable item between a check and insert.
	// Public-list visibility is non-hidden and non-soft-deleted, regardless of viewer role.
	result := h.db.WithContext(c.Request.Context()).Exec(`INSERT INTO saved_items (user_uid, item_id, created_at)
 SELECT ?, id, ? FROM items WHERE id = ? AND is_hidden = ? AND deleted_at IS NULL
 ON CONFLICT (user_uid, item_id) DO NOTHING`, uid(c), time.Now().UTC(), id, false)
	if result.Error != nil {
		fail(c)
		return
	}
	if result.RowsAffected == 0 {
		var count int64
		if err := h.db.WithContext(c.Request.Context()).Model(&models.SavedItem{}).Where("user_uid = ? AND item_id = ?", uid(c), id).Count(&count).Error; err != nil {
			fail(c)
			return
		}
		if count == 0 {
			response.Error(c, 404, "Item unavailable")
			return
		}
	}
	response.Success(c, 200, "Item saved", gin.H{"item_id": id, "saved": true})
}
func (h *Handler) remove(c *gin.Context) {
	id, ok := pathID(c)
	if !ok {
		return
	}
	if err := h.db.WithContext(c.Request.Context()).Where("user_uid = ? AND item_id = ?", uid(c), id).Delete(&models.SavedItem{}).Error; err != nil {
		fail(c)
		return
	}
	response.Success(c, 200, "Item unsaved", gin.H{"item_id": id, "saved": false})
}
func (h *Handler) status(c *gin.Context) {
	raw := c.Query("ids")
	if len(raw) == 0 || len(raw) > 1100 {
		response.Error(c, 400, "ids must contain 1 to 100 item IDs")
		return
	}
	parts := strings.Split(raw, ",")
	if len(parts) > 100 {
		response.Error(c, 400, "At most 100 item IDs")
		return
	}
	ids := make([]uint, 0, len(parts))
	seen := map[uint]bool{}
	for _, part := range parts {
		id, e := parseID(strings.TrimSpace(part))
		if e != nil {
			response.Error(c, 400, "Invalid item ID")
			return
		}
		if !seen[id] {
			ids = append(ids, id)
			seen[id] = true
		}
	}
	var rows []models.SavedItem
	if err := h.db.WithContext(c.Request.Context()).Select("item_id").Where("user_uid = ? AND item_id IN ?", uid(c), ids).Find(&rows).Error; err != nil {
		fail(c)
		return
	}
	saved := map[uint]bool{}
	for _, row := range rows {
		saved[row.ItemID] = true
	}
	statuses := make([]gin.H, 0, len(ids))
	for _, id := range ids {
		statuses = append(statuses, gin.H{"item_id": id, "saved": saved[id]})
	}
	response.Success(c, 200, "Saved status retrieved", gin.H{"items": statuses})
}

// PublicItem is an explicit allowlist; no user/contact, custody, fingerprint or private fields.
type PublicItem struct {
	ID          uint               `json:"id"`
	Title       string             `json:"title"`
	Type        models.ItemType    `json:"type"`
	Status      models.ItemStatus  `json:"status"`
	Description string             `json:"description"`
	CategoryID  uint               `json:"category_id"`
	LocationID  uint               `json:"location_id"`
	Date        string             `json:"date"`
	Color       string             `json:"color"`
	Brand       string             `json:"brand"`
	Images      []models.ItemImage `json:"images"`
}
type entry struct {
	ItemID    uint        `json:"item_id"`
	SavedAt   time.Time   `json:"saved_at"`
	Available bool        `json:"available"`
	Item      *PublicItem `json:"item,omitempty"`
}

func bounded(c *gin.Context, key string, def, max int) (int, bool) {
	raw, exists := c.GetQuery(key)
	if !exists {
		return def, true
	}
	n, e := strconv.Atoi(raw)
	if e != nil || n < 1 || n > max {
		response.Error(c, 400, "Invalid "+key)
		return 0, false
	}
	return n, true
}
func (h *Handler) list(c *gin.Context) {
	page, ok := bounded(c, "page", 1, 1000000)
	if !ok {
		return
	}
	limit, ok := bounded(c, "limit", 20, 100)
	if !ok {
		return
	}
	search := strings.TrimSpace(c.Query("search"))
	if len(search) > 200 {
		response.Error(c, 400, "Search too long")
		return
	}
	typ := c.DefaultQuery("type", "ALL")
	if typ != "ALL" && typ != "LOST" && typ != "FOUND" {
		response.Error(c, 400, "Invalid type")
		return
	}
	status := c.DefaultQuery("status", "ALL")
	switch status {
	case "ALL", "LOST", "FOUND", "RETURNED", "CLOSED":
	default:
		response.Error(c, 400, "Invalid status")
		return
	}
	db := h.db.WithContext(c.Request.Context())
	// Hidden/deleted rows join as NULL, preventing filters from disclosing their fields.
	q := db.Model(&models.SavedItem{}).Joins("LEFT JOIN items ON items.id = saved_items.item_id AND items.is_hidden = ? AND items.deleted_at IS NULL", false).Where("saved_items.user_uid = ?", uid(c))
	if typ != "ALL" {
		q = q.Where("items.type = ?", typ)
	}
	if status != "ALL" {
		q = q.Where("items.status = ?", status)
	}
	if search != "" {
		term := "%" + strings.NewReplacer("!", "!!", "%", "!%", "_", "!_").Replace(strings.ToLower(search)) + "%"
		q = q.Where("(LOWER(items.title) LIKE ? ESCAPE '!' OR LOWER(items.description) LIKE ? ESCAPE '!' OR LOWER(items.brand) LIKE ? ESCAPE '!' OR LOWER(items.color) LIKE ? ESCAPE '!')", term, term, term, term)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		fail(c)
		return
	}
	var rows []models.SavedItem
	if err := q.Select("saved_items.*").Order("saved_items.created_at DESC, saved_items.id DESC").Offset((page - 1) * limit).Limit(limit).Find(&rows).Error; err != nil {
		fail(c)
		return
	}
	ids := make([]uint, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ItemID)
	}
	items := []models.Item{}
	if len(ids) > 0 {
		if err := db.Select("id", "title", "type", "status", "description", "category_id", "location_id", "date", "color", "brand").Where("id IN ? AND is_hidden = ?", ids, false).Preload("Images", func(q *gorm.DB) *gorm.DB { return q.Order("sort_order ASC, id ASC") }).Find(&items).Error; err != nil {
			fail(c)
			return
		}
	}
	byID := map[uint]*PublicItem{}
	for _, it := range items {
		images := it.Images
		if images == nil {
			images = []models.ItemImage{}
		}
		byID[it.ID] = &PublicItem{ID: it.ID, Title: it.Title, Type: it.Type, Status: it.Status, Description: it.Description, CategoryID: it.CategoryID, LocationID: it.LocationID, Date: it.Date, Color: it.Color, Brand: it.Brand, Images: images}
	}
	entries := make([]entry, 0, len(rows))
	for _, row := range rows {
		it := byID[row.ItemID]
		entries = append(entries, entry{ItemID: row.ItemID, SavedAt: row.CreatedAt, Available: it != nil, Item: it})
	}
	response.Success(c, http.StatusOK, "Saved items retrieved", gin.H{"items": entries, "total": total, "page": page, "limit": limit})
}
