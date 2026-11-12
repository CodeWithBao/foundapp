// Package statistics exposes aggregate counts only; it never returns user data.
package statistics

import (
	"net/http"
	"regexp"
	"sync"
	"time"

	"unifind-dntu/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const PresenceTTL = 90 * time.Second
const maxSessions = 10000

var sessionPattern = regexp.MustCompile(`^[a-f0-9]{32}$`)

type Handler struct {
	db       *gorm.DB
	mu       sync.Mutex
	sessions map[string]time.Time
	now      func() time.Time
	tokens   float64
	refill   time.Time
	stop     chan struct{}
}

func NewHandler(db *gorm.DB) *Handler {
	h := &Handler{db: db, sessions: make(map[string]time.Time), now: time.Now, tokens: 200, refill: time.Now(), stop: make(chan struct{})}
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				h.mu.Lock()
				h.prune(h.now())
				h.mu.Unlock()
			case <-h.stop:
				return
			}
		}
	}()
	return h
}

func (h *Handler) Close() { close(h.stop) }
func (h *Handler) prune(now time.Time) {
	for id, seen := range h.sessions {
		if !seen.After(now.Add(-PresenceTTL)) {
			delete(h.sessions, id)
		}
	}
}

// A process-wide bounded token bucket protects both public routes without storing IP/PII.
func (h *Handler) limit(c *gin.Context) {
	h.mu.Lock()
	now := h.now()
	h.tokens += now.Sub(h.refill).Seconds() * 100
	if h.tokens > 200 {
		h.tokens = 200
	}
	h.refill = now
	allowed := h.tokens >= 1
	if allowed {
		h.tokens--
	}
	h.mu.Unlock()
	c.Header("Cache-Control", "no-store")
	if !allowed {
		c.Header("Retry-After", "1")
		c.AbortWithStatusJSON(429, gin.H{"error": "statistics_busy"})
		return
	}
	c.Next()
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/statistics", h.limit, h.stats)
	r.POST("/statistics/heartbeat", h.limit, h.heartbeat)
}

func (h *Handler) heartbeat(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 128)
	var input struct {
		SessionID string `json:"session_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || !sessionPattern.MatchString(input.SessionID) {
		c.JSON(400, gin.H{"error": "invalid_session_id"})
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	now := h.now()
	h.prune(now)
	seen, exists := h.sessions[input.SessionID]
	// Multiple tabs share one ID. Frequent repeats neither add visits nor extend TTL.
	if exists && now.Sub(seen) < 10*time.Second {
		c.JSON(200, gin.H{"active_sessions": len(h.sessions), "window_seconds": 90})
		return
	}
	if !exists && len(h.sessions) >= maxSessions {
		c.JSON(503, gin.H{"error": "presence_capacity"})
		return
	}
	h.sessions[input.SessionID] = now
	c.JSON(200, gin.H{"active_sessions": len(h.sessions), "window_seconds": 90})
}

func (h *Handler) stats(c *gin.Context) {
	var members, total, returned int64
	// Match existing aggregate semantics: non-deleted members; public non-hidden posts.
	// RETURNED is set by the existing handover transaction. CLOSED is NOT success.
	err := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Count(&members).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Item{}).Where("is_hidden = ?", false).Count(&total).Error; err != nil {
			return err
		}
		return tx.Model(&models.Item{}).Where("is_hidden = ? AND status = ?", false, models.ItemStatusReturned).Count(&returned).Error
	})
	if err != nil {
		c.JSON(503, gin.H{"error": "statistics_unavailable"})
		return
	}
	var rate *float64
	if total > 0 {
		value := float64(returned) * 100 / float64(total)
		rate = &value
	}
	h.mu.Lock()
	h.prune(h.now())
	active := len(h.sessions)
	h.mu.Unlock()
	c.JSON(200, gin.H{"members": members, "total_posts": total, "returned_posts": returned, "returned_post_rate": rate, "active_sessions": active, "window_seconds": 90, "updated_at": h.now().UTC()})
}
