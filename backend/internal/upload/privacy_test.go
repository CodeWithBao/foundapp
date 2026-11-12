package upload

import (
	"net/http/httptest"
	"path/filepath"
	"testing"
	"unifind-dntu/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestProofIsNotPublic(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "privacy.db")), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	t.Cleanup(func() { sqlDB.Close() })
	if err = db.AutoMigrate(&models.User{}, &models.Category{}, &models.Location{}, &models.Item{}, &models.ItemImage{}, &models.UploadedImage{}); err != nil {
		t.Fatal(err)
	}
	if err = db.Create(&models.UploadedImage{ID: "proof", UserID: 1, ContentType: "image/png", Data: []byte("private proof")}).Error; err != nil {
		t.Fatal(err)
	}
	h := NewHandler(db)
	for _, tc := range []struct {
		name   string
		id     uint
		role   models.Role
		status int
	}{{"guest", 0, "", 403}, {"outsider", 2, models.RoleUser, 403}, {"owner", 1, models.RoleUser, 200}, {"staff", 3, models.RoleStaff, 200}, {"admin", 4, models.RoleAdmin, 200}} {
		t.Run(tc.name, func(t *testing.T) {
			r := gin.New()
			r.GET("/uploads/:id", func(c *gin.Context) { c.Set("user_id", tc.id); c.Set("role", tc.role); h.Get(c) })
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest("GET", "/uploads/proof", nil))
			if w.Code != tc.status {
				t.Fatalf("got %d want %d", w.Code, tc.status)
			}
			if w.Header().Get("Cache-Control") == "public, max-age=31536000, immutable" {
				t.Fatal("proof publicly cached")
			}
		})
	}
}
