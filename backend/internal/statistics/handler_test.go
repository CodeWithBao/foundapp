package statistics

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"unifind-dntu/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestStatisticsAndPresence(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err = db.AutoMigrate(&models.User{}, &models.Item{}); err != nil {
		t.Fatal(err)
	}
	h := NewHandler(db)
	defer h.Close()
	now := time.Now()
	h.now = func() time.Time { return now }
	r := gin.New()
	h.RegisterRoutes(r.Group("/api/v1"))
	call := func(method, path, body string) (int, map[string]interface{}) {
		t.Helper()
		w := httptest.NewRecorder()
		req := httptest.NewRequest(method, "/api/v1/statistics"+path, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		var data map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &data)
		return w.Code, data
	}
	code, data := call("GET", "", "")
	if code != 200 || data["members"] != float64(0) || data["returned_post_rate"] != nil {
		t.Fatalf("empty: %d %v", code, data)
	}
	users := []models.User{{Name: "A", Email: "a@test"}, {Name: "B", Email: "b@test"}}
	if err = db.Create(&users).Error; err != nil {
		t.Fatal(err)
	}
	db.Delete(&users[1])
	for i, status := range []models.ItemStatus{models.ItemStatusLost, models.ItemStatusFound, models.ItemStatusClosed, models.ItemStatusReturned, models.ItemStatusReturned, models.ItemStatusReturned} {
		item := models.Item{Title: "test", Type: models.ItemTypeFound, Status: status, UserID: users[0].ID, CategoryID: 1, LocationID: 1, IsHidden: i == 4}
		if err = db.Create(&item).Error; err != nil {
			t.Fatal(err)
		}
		if i == 5 {
			db.Delete(&item)
		}
	}
	code, data = call("GET", "", "")
	if code != 200 || data["members"] != float64(1) || data["total_posts"] != float64(4) || data["returned_posts"] != float64(1) || data["returned_post_rate"] != float64(25) {
		t.Fatalf("counts: %v", data)
	}
	id := strings.Repeat("a", 32)
	for i := 0; i < 2; i++ {
		code, data = call("POST", "/heartbeat", `{"session_id":"`+id+`"}`)
		if code != 200 || data["active_sessions"] != float64(1) {
			t.Fatalf("dedup: %v", data)
		}
	}
	for _, body := range []string{`{}`, `{"session_id":"bad"}`, `{"session_id":"` + strings.Repeat("b", 129) + `"}`, `{"session_id":123}`, `not-json`} {
		if code, _ = call("POST", "/heartbeat", body); code != 400 {
			t.Fatalf("invalid accepted: %s", body)
		}
	}
	now = now.Add(90 * time.Second)
	_, data = call("GET", "", "")
	if data["active_sessions"] != float64(0) || len(h.sessions) != 0 {
		t.Fatal("expiry failed")
	}
	h.tokens = 0
	h.refill = now
	if code, _ = call("GET", "", ""); code != 429 {
		t.Fatal("rate limit missing")
	}
	h.tokens = 200
	for i := 0; i < maxSessions; i++ {
		h.sessions[strings.Repeat("z", i%1)+string(rune(i))] = now
	}
	if code, _ = call("POST", "/heartbeat", `{"session_id":"`+id+`"}`); code != 503 {
		t.Fatal("capacity missing")
	}
	sqlDB, _ := db.DB()
	sqlDB.Close()
	if code, _ = call("GET", "", ""); code != 503 {
		t.Fatal("DB error must not return zero")
	}
}
