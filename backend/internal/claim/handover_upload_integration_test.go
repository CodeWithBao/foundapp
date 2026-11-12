package claim

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"unifind-dntu/internal/database"
	"unifind-dntu/internal/middleware"
	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/facade"
	"unifind-dntu/internal/upload"
	"unifind-dntu/pkg/jwt"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// Uses only synthetic fixtures in a temporary database, never the local app DB.
func TestPrivateUploadHandoverReloadIntegration(t *testing.T) {
	t.Setenv("JWT_SECRET", "isolated-handover-integration-only")
	path := filepath.Join(t.TempDir(), "integration.db")
	open := func() *gorm.DB {
		t.Helper()
		db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
		if err != nil {
			t.Fatal(err)
		}
		sqlDB, err := db.DB()
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { sqlDB.Close() })
		return db
	}
	db := open()
	if err := database.AutoMigrate(db); err != nil {
		t.Fatal(err)
	}
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	users := []models.User{
		{Name: "Fixture recipient", Email: "recipient@example.test", Role: models.RoleUser},
		{Name: "Fixture finder", Email: "finder@example.test", Role: models.RoleUser},
		{Name: "Fixture staff", Email: "staff@example.test", Role: models.RoleStaff},
		{Name: "Fixture outsider", Email: "outsider@example.test", Role: models.RoleUser},
	}
	for i := range users {
		must(db.Create(&users[i]).Error)
	}
	tokens := make([]string, len(users))
	for i := range users {
		var err error
		tokens[i], err = jwt.GenerateToken(&users[i])
		must(err)
	}
	item := models.Item{UserID: users[1].ID, Title: "Isolated fixture", Status: models.ItemStatusFound}
	must(db.Create(&item).Error)
	claim := models.Claim{ItemID: item.ID, ClaimantID: users[0].ID, Status: models.ClaimStatusApproved}
	must(db.Create(&claim).Error)
	router := func(db *gorm.DB) *gin.Engine {
		r := gin.New()
		api := r.Group("/api/v1")
		upload.NewHandler(db).RegisterRoutes(api, middleware.AuthRequired(), nil)
		NewClaimHandler(facade.NewClaimFacade(db, nil), NewClaimRepository(db)).RegisterRoutes(api, middleware.AuthRequired(), middleware.RequireRole(models.RoleStaff, models.RoleAdmin))
		return r
	}
	r := router(db)
	request := func(method, url, token, contentType string, body []byte, status int) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, url, bytes.NewReader(body))
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		if contentType != "" {
			req.Header.Set("Content-Type", contentType)
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != status {
			t.Fatalf("%s %s: got %d want %d: %s", method, url, w.Code, status, w.Body.String())
		}
		return w
	}
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("image", "fixture.png")
	must(err)
	image := append([]byte{137, 80, 78, 71, 13, 10, 26, 10}, make([]byte, 64)...)
	_, err = part.Write(image)
	must(err)
	must(writer.Close())
	w := request(http.MethodPost, "/api/v1/uploads", tokens[2], writer.FormDataContentType(), body.Bytes(), 201)
	var uploaded struct {
		Data struct {
			URL string `json:"url"`
		} `json:"data"`
	}
	must(json.Unmarshal(w.Body.Bytes(), &uploaded))
	url := uploaded.Data.URL
	if url == "" {
		t.Fatal("missing uploaded URL")
	}
	request(http.MethodGet, url, "", "", nil, 403)
	request(http.MethodGet, url, tokens[3], "", nil, 403)
	payload, err := json.Marshal(map[string]any{"evidence_images": []string{url}, "recipient_name": "Fixture recipient", "notes": "isolated integration"})
	must(err)
	endpoint := fmt.Sprintf("/api/v1/claims/%d/handover", claim.ID)
	request(http.MethodPost, endpoint, tokens[3], "application/json", payload, 403)
	request(http.MethodPost, endpoint, tokens[2], "application/json", payload, 200)
	// Reopen SQLite and rebuild handlers: evidence must survive a fresh connection.
	r = router(open())
	w = request(http.MethodGet, "/api/v1/claims/handovers", tokens[2], "", nil, 200)
	var list struct {
		Data []models.HandoverRecord `json:"data"`
	}
	must(json.Unmarshal(w.Body.Bytes(), &list))
	if len(list.Data) != 1 || len(list.Data[0].EvidenceImages) != 1 || list.Data[0].EvidenceImages[0] != url {
		t.Fatal("reloaded handover lost uploaded evidence")
	}
	var persisted models.Claim
	must(db.First(&persisted, claim.ID).Error)
	if persisted.Status != models.ClaimStatusCompleted {
		t.Fatalf("claim not completed: %s", persisted.Status)
	}
	for _, tc := range []struct {
		token  string
		status int
	}{{"", 403}, {"invalid", 403}, {tokens[1], 403}, {tokens[3], 403}, {tokens[0], 200}, {tokens[2], 200}} {
		w = request(http.MethodGet, url, tc.token, "", nil, tc.status)
		if tc.status == 200 && (!bytes.Equal(w.Body.Bytes(), image) || w.Header().Get("Cache-Control") != "private, no-store") {
			t.Fatal("private image content/cache mismatch")
		}
	}
}
