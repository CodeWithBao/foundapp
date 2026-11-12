package claim

import (
	"errors"
	"fmt"
	"net/http/httptest"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/facade"
	"unifind-dntu/internal/upload"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestHandoverPrivateImages(t *testing.T) {
	for _, mode := range []string{"multiple", "legacy", "mixed", "none"} {
		t.Run(mode, func(t *testing.T) {
			db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "handover.db")), &gorm.Config{})
			if err != nil {
				t.Fatal(err)
			}
			sqlDB, _ := db.DB()
			t.Cleanup(func() { sqlDB.Close() })
			if err := db.AutoMigrate(&models.User{}, &models.Item{}, &models.ItemImage{}, &models.Claim{}, &models.HandoverRecord{}, &models.UploadedImage{}); err != nil {
				t.Fatal(err)
			}
			must := func(err error) {
				t.Helper()
				if err != nil {
					t.Fatal(err)
				}
			}
			item := models.Item{UserID: 2, Title: "Found", Status: models.ItemStatusFound}
			must(db.Create(&item).Error)
			claim := models.Claim{ItemID: item.ID, ClaimantID: 1, Status: models.ClaimStatusApproved}
			must(db.Create(&claim).Error)
			ids := []string{strings.Repeat("a", 32), strings.Repeat("b", 32), strings.Repeat("c", 32), strings.Repeat("d", 32)}
			urls := make([]string, len(ids))
			for i, id := range ids {
				owner := uint(3)
				if i == 2 {
					owner = 4
				}
				must(db.Create(&models.UploadedImage{ID: id, UserID: owner, ContentType: "image/png", Data: []byte("private")}).Error)
				urls[i] = "/api/v1/uploads/" + id
			}
			must(db.Create(&models.ItemImage{ItemID: item.ID, ImageURL: urls[3]}).Error)
			router := gin.New()
			handler := NewClaimHandler(facade.NewClaimFacade(db, nil), NewClaimRepository(db))
			router.POST("/handover", func(c *gin.Context) {
				c.Set("user_id", uint(3))
				c.Params = gin.Params{{Key: "id", Value: fmt.Sprint(claim.ID)}}
				handler.Handover(c)
			})
			request := func(body string, status int) {
				t.Helper()
				w := httptest.NewRecorder()
				r := httptest.NewRequest("POST", "/handover", strings.NewReader(body))
				r.Header.Set("Content-Type", "application/json")
				router.ServeHTTP(w, r)
				if w.Code != status {
					t.Fatalf("body %s: got %d want %d: %s", body, w.Code, status, w.Body.String())
				}
			}
			for _, invalid := range []string{"https://outside.test/a.png", "//outside.test/a.png", "/uploads/a.png", "/api/v1/uploads/../a", "/api/v1/uploads/%2e%2e%2fa", urls[2], urls[3], "/api/v1/uploads/" + strings.Repeat("e", 32), urls[0] + "?public=1"} {
				request(fmt.Sprintf(`{"evidence_images":[%q,%q]}`, urls[0], invalid), 400)
				var current models.Claim
				must(db.First(&current, claim.ID).Error)
				if current.Status != models.ClaimStatusApproved {
					t.Fatal("invalid request modified claim")
				}
				var count int64
				must(db.Model(&models.HandoverRecord{}).Count(&count).Error)
				if count != 0 {
					t.Fatal("invalid request persisted record")
				}
				var currentItem models.Item
				must(db.First(&currentItem, item.ID).Error)
				if currentItem.Status != models.ItemStatusFound {
					t.Fatal("invalid request modified item")
				}
			}
			request(`{"evidence_images":"wrong"}`, 400)
			request(`{"evidence_image":123}`, 400)
			want := []string{urls[0], urls[1]}
			body := fmt.Sprintf(`{"evidence_images":[%q,%q]}`, urls[0], urls[1])
			if mode == "legacy" {
				body = fmt.Sprintf(`{"evidence_image":%q}`, urls[0])
				want = want[:1]
			}
			if mode == "mixed" {
				body = fmt.Sprintf(`{"evidence_images":[%q,%q],"evidence_image":%q}`, urls[0], urls[1], urls[0])
			}
			if mode == "none" {
				body = `{}`
				want = []string{}
			}
			// Fail record insertion after claim/item updates to verify transaction rollback.
			must(db.Callback().Create().Before("gorm:create").Register("test:fail_handover", func(tx *gorm.DB) {
				if tx.Statement.Table == "handover_records" {
					tx.AddError(errors.New("injected handover persistence failure"))
				}
			}))
			request(body, 400)
			must(db.Callback().Create().Remove("test:fail_handover"))
			var rolledBackClaim models.Claim
			must(db.First(&rolledBackClaim, claim.ID).Error)
			var rolledBackItem models.Item
			must(db.First(&rolledBackItem, item.ID).Error)
			var recordCount int64
			must(db.Model(&models.HandoverRecord{}).Count(&recordCount).Error)
			if rolledBackClaim.Status != models.ClaimStatusApproved || rolledBackItem.Status != models.ItemStatusFound || recordCount != 0 {
				t.Fatal("handover persistence failure did not roll back transaction")
			}
			request(body, 200)
			var record models.HandoverRecord
			must(db.First(&record).Error)
			if !reflect.DeepEqual(record.EvidenceImages, want) {
				t.Fatalf("persisted %v want %v", record.EvidenceImages, want)
			}
			if len(want) > 0 && record.EvidenceImage != want[0] {
				t.Fatal("legacy field not persisted")
			}
			if mode == "none" {
				return
			}
			// A subsequent public attachment must not expose handover proof.
			must(db.Create(&models.ItemImage{ItemID: item.ID, ImageURL: urls[0]}).Error)
			imageHandler := upload.NewHandler(db)
			for _, tc := range []struct {
				id     uint
				role   models.Role
				status int
			}{{0, "", 403}, {2, models.RoleUser, 403}, {1, models.RoleUser, 200}, {3, models.RoleStaff, 200}, {4, models.RoleAdmin, 200}, {5, models.RoleStaff, 200}} {
				for _, imageURL := range want {
					r := gin.New()
					r.GET("/api/v1/uploads/:id", func(c *gin.Context) { c.Set("user_id", tc.id); c.Set("role", tc.role); imageHandler.Get(c) })
					w := httptest.NewRecorder()
					r.ServeHTTP(w, httptest.NewRequest("GET", imageURL, nil))
					if w.Code != tc.status {
						t.Fatalf("image %s user %d: got %d want %d", imageURL, tc.id, w.Code, tc.status)
					}
					if w.Code == 200 && w.Header().Get("Cache-Control") != "private, no-store" {
						t.Fatal("private cache policy missing")
					}
				}
			}
		})
	}
}
