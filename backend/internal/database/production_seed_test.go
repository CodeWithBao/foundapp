package database

import (
	"testing"
	"unifind-dntu/internal/models"
)

func TestSeedDataProductionNeverCreatesDemoRecords(t *testing.T) {
	t.Setenv("DB_DRIVER", "postgres")
	t.Setenv("GIN_MODE", "release")
	t.Setenv("SEED_DEMO_DATA", "true")
	db := newSeedTestDB(t)
	if err := db.AutoMigrate(&models.Claim{}); err != nil {
		t.Fatal(err)
	}
	SeedData(db)
	for _, model := range []interface{}{&models.User{}, &models.Item{}, &models.Claim{}, &models.ChatConversation{}, &models.ChatMessage{}} {
		var count int64
		if err := db.Model(model).Count(&count).Error; err != nil {
			t.Fatal(err)
		}
		if count != 0 {
			t.Fatalf("production created demo records for %T: %d", model, count)
		}
	}
	if err := db.Create(&models.User{Name: "Real user", Email: "real@example.invalid"}).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.Item{Title: "Real item", UserID: 1, CategoryID: 1, LocationID: 1}).Error; err != nil {
		t.Fatal(err)
	}
	SeedData(db)
	var count int64
	if err := db.Model(&models.Claim{}).Count(&count).Error; err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatal("production seeded claims on real items")
	}
}
