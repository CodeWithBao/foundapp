package claim

import (
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"unifind-dntu/internal/middleware"
	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/facade"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestClaimRolesAndHandoverPersistence(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "claims.db")), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	t.Cleanup(func() { sqlDB.Close() })
	if err = db.AutoMigrate(&models.User{}, &models.Category{}, &models.Location{}, &models.Item{}, &models.Claim{}, &models.ClaimEvidence{}, &models.HandoverRecord{}); err != nil {
		t.Fatal(err)
	}
	roles := []models.Role{models.RoleUser, models.RoleUser, models.RoleStaff, models.RoleAdmin}
	for i, role := range roles {
		if err = db.Create(&models.User{ID: uint(i + 1), Name: fmt.Sprint("User", i), Email: fmt.Sprint(i, "@test"), Role: role, Status: "ACTIVE"}).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err = db.Create(&models.Item{ID: 1, UserID: 2, Title: "Found bag", Type: models.ItemTypeFound, Status: models.ItemStatusFound}).Error; err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	NewClaimHandler(facade.NewClaimFacade(db, nil), NewClaimRepository(db)).RegisterRoutes(router.Group("/api/v1"), func(c *gin.Context) {
		var id uint
		fmt.Sscanf(c.GetHeader("X-Test-User"), "%d", &id)
		if id < 1 || id > 4 {
			c.AbortWithStatus(401)
			return
		}
		c.Set("user_id", id)
		c.Set("role", roles[id-1])
	}, middleware.RequireRole(models.RoleStaff, models.RoleAdmin))
	req := func(user int, method, path, body string, status int) []byte {
		t.Helper()
		r := httptest.NewRequest(method, "/api/v1/claims"+path, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("X-Test-User", fmt.Sprint(user))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != status {
			t.Fatalf("user%d %s %s got %d want %d %s", user, method, path, w.Code, status, w.Body.String())
		}
		return w.Body.Bytes()
	}
	b := req(1, "POST", "", `{"item_id":1,"reason":"my bag","secret_details":"private serial","evidences":["data:image/png;base64,private"]}`, 201)
	var out struct {
		Data models.Claim `json:"data"`
	}
	json.Unmarshal(b, &out)
	path := fmt.Sprint("/", out.Data.ID)
	req(2, "GET", path, "", 403)
	if strings.Contains(string(req(2, "GET", "", "", 200)), "private serial") {
		t.Fatal("outsider claim list leak")
	}
	req(1, "PUT", path+"/approve", `{}`, 403)
	req(3, "POST", path+"/handover", `{}`, 400)
	req(3, "PUT", path+"/review", `{"note":"checking"}`, 200)
	req(4, "PUT", path+"/approve", `{"note":"verified"}`, 200)
	if !strings.Contains(string(req(1, "GET", path, "", 200)), "APPROVED") {
		t.Fatal("owner cannot see approval")
	}
	req(3, "PUT", path+"/ready", `{}`, 200)
	req(3, "POST", path+"/handover", `{"notes":"received"}`, 200)
	req(3, "POST", path+"/handover", `{}`, 400)
	req(4, "PUT", path+"/approve", `{}`, 400)
	if !strings.Contains(string(req(1, "GET", path, "", 200)), "COMPLETED") {
		t.Fatal("owner not updated")
	}
	req(1, "GET", "/handovers", "", 403)
	req(4, "GET", "/handovers", "", 200)
	var count int64
	db.Model(&models.HandoverRecord{}).Count(&count)
	if count != 1 {
		t.Fatal("duplicate handover")
	}
	var item models.Item
	db.First(&item, 1)
	if item.Status != models.ItemStatusReturned {
		t.Fatal("item not returned")
	}
}
