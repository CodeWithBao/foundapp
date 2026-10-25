package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRateLimitMiddleware_BlocksExcessiveRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// 2 requests per minute, burst of 2
	r.Use(RateLimitMiddleware(2, 2))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.50:12345"
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Request %d expected 200, got %d", i+1, w.Code)
		}
	}

	// 3rd request should be blocked (429)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.50:12345"
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected 429 Too Many Requests, got %d", w.Code)
	}

	// Different IP should still pass
	wDiff := httptest.NewRecorder()
	reqDiff, _ := http.NewRequest("GET", "/test", nil)
	reqDiff.RemoteAddr = "192.168.1.51:12345"
	r.ServeHTTP(wDiff, reqDiff)

	if wDiff.Code != http.StatusOK {
		t.Fatalf("Expected 200 for different IP, got %d", wDiff.Code)
	}
}
