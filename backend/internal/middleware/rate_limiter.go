package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
}

type IPRateLimiter struct {
	mu         sync.Mutex
	clients    map[string]*clientBucket
	rate       float64 // tokens per second
	capacity   float64 // max tokens burst
	cleanupDur time.Duration
}

func NewIPRateLimiter(limitPerMinute int, burst int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients:    make(map[string]*clientBucket),
		rate:       float64(limitPerMinute) / 60.0,
		capacity:   float64(burst),
		cleanupDur: 5 * time.Minute,
	}

	go limiter.cleanupLoop()
	return limiter
}

func (l *IPRateLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	b, exists := l.clients[ip]
	if !exists {
		l.clients[ip] = &clientBucket{
			tokens:     l.capacity - 1,
			lastRefill: now,
		}
		return true
	}

	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * l.rate
	if b.tokens > l.capacity {
		b.tokens = l.capacity
	}
	b.lastRefill = now

	if b.tokens >= 1.0 {
		b.tokens -= 1.0
		return true
	}

	return false
}

func (l *IPRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(l.cleanupDur)
	for range ticker.C {
		l.mu.Lock()
		cutoff := time.Now().Add(-10 * time.Minute)
		for ip, b := range l.clients {
			if b.lastRefill.Before(cutoff) {
				delete(l.clients, ip)
			}
		}
		l.mu.Unlock()
	}
}

// RateLimitMiddleware returns a Gin middleware for rate limiting
func RateLimitMiddleware(limitPerMinute int, burst int) gin.HandlerFunc {
	limiter := NewIPRateLimiter(limitPerMinute, burst)
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		if clientIP == "" {
			clientIP = "unknown"
		}

		if !limiter.allow(clientIP) {
			c.Header("Retry-After", fmt.Sprintf("%d", 60/limitPerMinute+1))
			response.Error(c, http.StatusTooManyRequests, "Quá nhiều yêu cầu, vui lòng thử lại sau giây lát (Rate limit exceeded)")
			c.Abort()
			return
		}

		c.Next()
	}
}
