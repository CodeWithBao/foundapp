package ticket

import (
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"unifind-dntu/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestTicketPersistedRoleIsolation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "tickets.db")), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { sqlDB.Close() })
	if err = db.AutoMigrate(&models.User{}, &models.SupportTicket{}, &models.SupportTicketMessage{}); err != nil {
		t.Fatal(err)
	}
	for i, role := range []models.Role{models.RoleUser, models.RoleUser, models.RoleStaff, models.RoleAdmin} {
		u := models.User{ID: uint(i + 1), Name: fmt.Sprintf("user%d", i), Email: fmt.Sprintf("u%d@test.edu", i), Role: role, Status: "ACTIVE"}
		if err = db.Create(&u).Error; err != nil {
			t.Fatal(err)
		}
	}
	router := gin.New()
	NewHandler(db).RegisterRoutes(router.Group("/api/v1"), func(c *gin.Context) {
		var id uint
		fmt.Sscanf(c.GetHeader("X-Test-User"), "%d", &id)
		if id == 0 {
			c.AbortWithStatus(401)
			return
		}
		c.Set("user_id", id)
	})
	request := func(user int, method, path, body string, status int) []byte {
		t.Helper()
		r := httptest.NewRequest(method, "/api/v1/tickets"+path, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("X-Test-User", fmt.Sprint(user))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != status {
			t.Fatalf("user=%d %s %s: got %d want %d: %s", user, method, path, w.Code, status, w.Body.String())
		}
		return w.Body.Bytes()
	}
	request(0, "GET", "", "", 401)
	b := request(1, "POST", "", `{"topic":"Private support","initialMessage":"private proof","userId":2,"userName":"Spoof"}`, 201)
	var result struct {
		Data models.SupportTicket `json:"data"`
	}
	if err = json.Unmarshal(b, &result); err != nil {
		t.Fatal(err)
	}
	id := result.Data.ID
	if result.Data.UserID != 1 || result.Data.UserName == "Spoof" {
		t.Fatal("client identity trusted")
	}
	for _, suffix := range []string{"", "/messages", "/status", "/read"} {
		method, body := "GET", ""
		if suffix == "/messages" {
			method = "POST"
			body = `{"text":"attack"}`
		} else if suffix != "" {
			method = "PUT"
			body = `{"status":"CLOSED"}`
		}
		request(2, method, "/"+id+suffix, body, 403)
	}
	if strings.Contains(string(request(2, "GET", "", "", 200)), "private proof") {
		t.Fatal("outsider list leaked proof")
	}
	request(1, "PUT", "/"+id+"/status", `{"status":"IN_PROGRESS"}`, 403)
	request(3, "PUT", "/"+id+"/status", `{"status":"IN_PROGRESS"}`, 200)
	request(3, "POST", "/"+id+"/messages", `{"text":"Staff reply","sender":"admin","senderName":"Spoof"}`, 200)
	b = request(1, "GET", "/"+id, "", 200)
	if !strings.Contains(string(b), "Staff reply") || !strings.Contains(string(b), `"sender":"staff"`) {
		t.Fatal("staff reply not persisted")
	}
	request(1, "PUT", "/"+id+"/read", `{}`, 200)
	request(4, "POST", "/"+id+"/messages", `{"text":"Admin reply"}`, 200)
	request(1, "POST", "/"+id+"/messages", `{"text":"User update"}`, 200)
	request(4, "PUT", "/"+id+"/status", `{"status":"RESOLVED"}`, 200)
	request(1, "POST", "/"+id+"/messages", `{"text":"closed update"}`, 409)
	var persisted models.SupportTicket
	if err = db.Preload("Messages").First(&persisted, "id = ?", id).Error; err != nil || len(persisted.Messages) != 4 || persisted.Status != "RESOLVED" {
		t.Fatalf("persistence: %+v %v", persisted, err)
	}
	db.Model(&models.User{}).Where("id = ?", 3).Update("status", "BANNED")
	request(3, "GET", "", "", 403)
}
