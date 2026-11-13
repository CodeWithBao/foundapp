package saveditem

import (
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"unifind-dntu/internal/database"
	"unifind-dntu/internal/middleware"
	"unifind-dntu/internal/models"
	token "unifind-dntu/pkg/jwt"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type fixture struct {
	db     *gorm.DB
	router *gin.Engine
	tokens []string
	path   string
}

func setup(t *testing.T) *fixture {
	t.Helper()
	t.Setenv("JWT_SECRET", "isolated-saved-items-test-secret")
	gin.SetMode(gin.TestMode)
	f := &fixture{path: filepath.Join(t.TempDir(), "saved.sqlite")}
	db, e := gorm.Open(sqlite.Open(f.path), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if e != nil {
		t.Fatal(e)
	}
	f.db = db
	sqlDB, e := db.DB()
	if e != nil {
		t.Fatal(e)
	}
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	must(t, db.Exec("PRAGMA foreign_keys = ON").Error)
	must(t, database.AutoMigrate(db))
	must(t, database.AutoMigrate(db))
	for i := 1; i <= 2; i++ {
		u := models.User{Name: fmt.Sprint("user", i), Email: fmt.Sprintf("user%d@test.invalid", i), Role: models.RoleUser}
		must(t, db.Create(&u).Error)
		tok, e := token.GenerateToken(&u)
		must(t, e)
		f.tokens = append(f.tokens, tok)
	}
	must(t, db.Create(&models.Category{Name: "Category"}).Error)
	must(t, db.Create(&models.Location{Name: "Location"}).Error)
	for i := 1; i <= 4; i++ {
		typ := models.ItemTypeLost
		status := models.ItemStatusLost
		if i%2 == 0 {
			typ = models.ItemTypeFound
			status = models.ItemStatusFound
		}
		if i == 4 {
			status = models.ItemStatusReturned
		}
		it := models.Item{Title: fmt.Sprintf("Wallet %d", i), Type: typ, Status: status, Description: "Public description", UserID: 1, CategoryID: 1, LocationID: 1, DistinctFeatures: "PRIVATE_MARKER", ImageFingerprint: "PRIVATE_MARKER", CurrentStorageLocation: "PRIVATE_MARKER"}
		must(t, db.Create(&it).Error)
	}
	f.route()
	return f
}
func (f *fixture) route() {
	f.router = gin.New()
	NewHandler(f.db).RegisterRoutes(f.router.Group("/api/v1"), middleware.AuthRequired())
}
func must(t *testing.T, e error) {
	t.Helper()
	if e != nil {
		t.Fatal(e)
	}
}
func (f *fixture) req(method, path string, user int) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "/api/v1/saved-items"+path, strings.NewReader(`{"user_uid":2,"user_id":2}`))
	if user > 0 {
		r.Header.Set("Authorization", "Bearer "+f.tokens[user-1])
	}
	w := httptest.NewRecorder()
	f.router.ServeHTTP(w, r)
	return w
}
func check(t *testing.T, w *httptest.ResponseRecorder, code int) {
	t.Helper()
	if w.Code != code {
		t.Fatalf("status %d want %d: %s", w.Code, code, w.Body.String())
	}
}
func data(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	check(t, w, 200)
	var v struct {
		Data map[string]interface{} `json:"data"`
	}
	must(t, json.Unmarshal(w.Body.Bytes(), &v))
	return v.Data
}
func total(t *testing.T, f *fixture, q string, want float64) {
	t.Helper()
	got := data(t, f.req("GET", q, 1))["total"]
	if got != want {
		t.Fatalf("%s total=%v want %v", q, got, want)
	}
}

func TestJWTIsolationIdempotencySpamPersistence(t *testing.T) {
	f := setup(t)
	for _, route := range []struct{ method, path string }{{"GET", ""}, {"GET", "/status?ids=1"}, {"PUT", "/1"}, {"DELETE", "/1"}} {
		check(t, f.req(route.method, route.path, 0), 401)
	}
	r := httptest.NewRequest("GET", "/api/v1/saved-items", nil)
	r.Header.Set("Authorization", "Bearer invalid")
	w := httptest.NewRecorder()
	f.router.ServeHTTP(w, r)
	check(t, w, 401)
	var wg sync.WaitGroup
	codes := make(chan int, 40)
	for i := 0; i < 40; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); codes <- f.req("PUT", "/1", 1).Code }()
	}
	wg.Wait()
	close(codes)
	for code := range codes {
		if code != 200 {
			t.Fatalf("spam code %d", code)
		}
	}
	var n int64
	must(t, f.db.Model(&models.SavedItem{}).Count(&n).Error)
	if n != 1 {
		t.Fatalf("duplicates: %d", n)
	}
	if e := f.db.Create(&models.SavedItem{UserUID: 1, ItemID: 1}).Error; e == nil {
		t.Fatal("missing unique constraint")
	}
	check(t, f.req("DELETE", "/1", 2), 200)
	total(t, f, "", 1)
	check(t, f.req("PUT", "/1", 2), 200)
	status := data(t, f.req("GET", "/status?ids=1,2,1", 2))["items"].([]interface{})
	if len(status) != 2 || !status[0].(map[string]interface{})["saved"].(bool) || status[1].(map[string]interface{})["saved"].(bool) {
		t.Fatal(status)
	}
	reopened, e := gorm.Open(sqlite.Open(f.path), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	must(t, e)
	sqlDB, e := reopened.DB()
	must(t, e)
	defer sqlDB.Close()
	f.db = reopened
	f.route()
	total(t, f, "", 1)
	check(t, f.req("DELETE", "/1", 1), 200)
	check(t, f.req("DELETE", "/1", 1), 200)
	total(t, f, "", 0)
	if !data(t, f.req("GET", "/status?ids=1", 2))["items"].([]interface{})[0].(map[string]interface{})["saved"].(bool) {
		t.Fatal("cross-user delete")
	}
}
func TestVisibilityDeletedFiltersAndBounds(t *testing.T) {
	f := setup(t)
	for i := 1; i <= 4; i++ {
		check(t, f.req("PUT", fmt.Sprintf("/%d", i), 1), 200)
	}
	total(t, f, "?type=LOST", 2)
	total(t, f, "?type=FOUND&status=RETURNED", 1)
	total(t, f, "?search=wallet%202", 1)
	total(t, f, "?search=%25", 0)
	d := data(t, f.req("GET", "?limit=1&page=2", 1))
	if len(d["items"].([]interface{})) != 1 || d["total"] != float64(4) {
		t.Fatal(d)
	}
	must(t, f.db.Model(&models.Item{}).Where("id = 1").Update("is_hidden", true).Error)
	must(t, f.db.Delete(&models.Item{}, 2).Error)
	total(t, f, "", 4)
	total(t, f, "?type=LOST", 1)
	total(t, f, "?search=Wallet%201", 0)
	body := f.req("GET", "", 1)
	check(t, body, 200)
	if strings.Contains(body.Body.String(), "PRIVATE_MARKER") || strings.Contains(body.Body.String(), "user_id") || strings.Contains(body.Body.String(), "fingerprint") {
		t.Fatal("private fields leaked", body.Body.String())
	}
	entries := data(t, body)["items"].([]interface{})
	for _, v := range entries {
		e := v.(map[string]interface{})
		if e["item_id"].(float64) <= 2 {
			if e["available"] != false || e["item"] != nil || len(e) != 3 {
				t.Fatal("unavailable leaked", e)
			}
		}
	}
	check(t, f.req("PUT", "/1", 1), 200)
	check(t, f.req("PUT", "/1", 2), 404)
	check(t, f.req("PUT", "/2", 2), 404)
	check(t, f.req("PUT", "/999", 1), 404)
	check(t, f.req("DELETE", "/2", 1), 200)
	check(t, f.req("DELETE", "/2", 1), 200)
	check(t, f.req("DELETE", "/999", 1), 200)
	for _, q := range []string{"?page=0", "?page=1000001", "?limit=101", "?limit=-1", "?type=BAD", "?status=BAD", "?search=" + strings.Repeat("a", 201), "/status?ids=0", "/status?ids=1,no", "/status?ids=", "/status?ids=" + strings.Repeat("1,", 100) + "1"} {
		check(t, f.req("GET", q, 1), 400)
	}
	for _, id := range []string{"0", "-1", "abc", "4294967296"} {
		check(t, f.req("PUT", "/"+id, 1), 400)
		check(t, f.req("DELETE", "/"+id, 1), 400)
	}
}
func TestForeignKeysAndHardDelete(t *testing.T) {
	f := setup(t)
	if e := f.db.Create(&models.SavedItem{UserUID: 999, ItemID: 1}).Error; e == nil {
		t.Fatal("missing user FK")
	}
	if e := f.db.Create(&models.SavedItem{UserUID: 1, ItemID: 999}).Error; e == nil {
		t.Fatal("missing item FK")
	}
	check(t, f.req("PUT", "/1", 1), 200)
	must(t, f.db.Unscoped().Delete(&models.Item{}, 1).Error)
	total(t, f, "", 0)
	check(t, f.req("DELETE", "/1", 1), 200)
	check(t, f.req("PUT", "/3", 2), 200)
	must(t, f.db.Unscoped().Delete(&models.User{}, 2).Error)
	var n int64
	must(t, f.db.Model(&models.SavedItem{}).Where("user_uid = 2").Count(&n).Error)
	if n != 0 {
		t.Fatal("user cascade failed")
	}
	check(t, f.req("GET", "", 2), 401)
}
