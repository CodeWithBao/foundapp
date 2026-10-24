package database

import (
	"os"
	"testing"

	"unifind-dntu/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func newSeedTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Location{},
		&models.Item{},
		&models.ItemImage{},
		&models.ChatConversation{},
		&models.ChatMessage{},
	); err != nil {
		t.Fatalf("migrate test database: %v", err)
	}

	return db
}

func TestSeedItemsEnsuresLocalDemoSetWithoutDuplicates(t *testing.T) {
	db := newSeedTestDB(t)
	seedUsers(db, true)
	seedCategories(db)
	seedLocations(db)

	seedItems(db, true)

	var initialCount int64
	db.Model(&models.Item{}).Count(&initialCount)
	if initialCount < 2 {
		t.Fatalf("expected multiple local demo items, got %d", initialCount)
	}

	seedItems(db, true)

	var repeatedCount int64
	db.Model(&models.Item{}).Count(&repeatedCount)
	if repeatedCount != initialCount {
		t.Fatalf("expected idempotent seed count %d, got %d", initialCount, repeatedCount)
	}

	var removed models.Item
	if err := db.First(&removed).Error; err != nil {
		t.Fatalf("find demo item to remove: %v", err)
	}
	if err := db.Unscoped().Delete(&removed).Error; err != nil {
		t.Fatalf("remove demo item: %v", err)
	}

	seedItems(db, true)

	var restoredCount int64
	db.Model(&models.Item{}).Count(&restoredCount)
	if restoredCount != initialCount {
		t.Fatalf("expected missing demo item to be restored to %d, got %d", initialCount, restoredCount)
	}
}

func TestSeedItemsKeepsExistingNonLocalBehavior(t *testing.T) {
	db := newSeedTestDB(t)
	seedUsers(db, true)
	seedCategories(db)
	seedLocations(db)
	seedItems(db, true)

	var initialCount int64
	db.Model(&models.Item{}).Count(&initialCount)

	var removed models.Item
	if err := db.First(&removed).Error; err != nil {
		t.Fatalf("find demo item to remove: %v", err)
	}
	if err := db.Unscoped().Delete(&removed).Error; err != nil {
		t.Fatalf("remove demo item: %v", err)
	}

	seedItems(db, false)

	var finalCount int64
	db.Model(&models.Item{}).Count(&finalCount)
	if finalCount != initialCount-1 {
		t.Fatalf("expected non-local seed to preserve existing behavior with %d items, got %d", initialCount-1, finalCount)
	}
}

func TestSeedLocalDemoChatsCreatesStableTestData(t *testing.T) {
	db := newSeedTestDB(t)
	seedUsers(db, true)
	seedCategories(db)
	seedLocations(db)
	seedItems(db, true)

	seedLocalDemoChats(db)

	var conversationCount int64
	db.Model(&models.ChatConversation{}).Count(&conversationCount)
	if conversationCount < 2 {
		t.Fatalf("expected multiple local demo conversations, got %d", conversationCount)
	}

	var messageCount int64
	db.Model(&models.ChatMessage{}).Count(&messageCount)
	if messageCount != 47 {
		t.Fatalf("expected 47 demo messages, got %d", messageCount)
	}

	var longConversation models.ChatConversation
	if err := db.Order("id ASC").First(&longConversation).Error; err != nil {
		t.Fatalf("find long demo conversation: %v", err)
	}
	var longConversationMessageCount int64
	db.Model(&models.ChatMessage{}).
		Where("conversation_id = ?", longConversation.ID).
		Count(&longConversationMessageCount)
	if longConversationMessageCount != 35 {
		t.Fatalf("expected 35 messages in the history test conversation, got %d", longConversationMessageCount)
	}

	var unreadCount int64
	db.Model(&models.ChatMessage{}).
		Where("sender_id <> ? AND read_at IS NULL", ownerIDForSeedTest(t, db)).
		Count(&unreadCount)
	if unreadCount != conversationCount {
		t.Fatalf("expected one unread incoming message per conversation, got %d", unreadCount)
	}

	seedLocalDemoChats(db)

	var repeatedConversationCount int64
	db.Model(&models.ChatConversation{}).Count(&repeatedConversationCount)
	if repeatedConversationCount != conversationCount {
		t.Fatalf("expected idempotent conversation count %d, got %d", conversationCount, repeatedConversationCount)
	}

	var repeatedMessageCount int64
	db.Model(&models.ChatMessage{}).Count(&repeatedMessageCount)
	if repeatedMessageCount != messageCount {
		t.Fatalf("expected idempotent message count %d, got %d", messageCount, repeatedMessageCount)
	}
}

func TestLocalDemoSeedGuardRejectsProduction(t *testing.T) {
	t.Setenv("DB_DRIVER", "sqlite")
	t.Setenv("DATABASE_URL", "unifind-dev.db")
	t.Setenv("GIN_MODE", "release")
	t.Setenv("SEED_DEMO_DATA", "true")
	if localDemoSeedEnabled() {
		t.Fatal("expected release mode to reject local demo seed")
	}

	t.Setenv("DB_DRIVER", "postgres")
	t.Setenv("DATABASE_URL", "postgres://localhost/unifind")
	t.Setenv("GIN_MODE", "debug")
	if localDemoSeedEnabled() {
		t.Fatal("expected PostgreSQL to reject local demo seed")
	}
}

func TestLocalDemoSeedDefaultsOnForLocalSQLite(t *testing.T) {
	original, existed := os.LookupEnv("SEED_DEMO_DATA")
	if err := os.Unsetenv("SEED_DEMO_DATA"); err != nil {
		t.Fatalf("unset SEED_DEMO_DATA: %v", err)
	}
	t.Cleanup(func() {
		if existed {
			_ = os.Setenv("SEED_DEMO_DATA", original)
		} else {
			_ = os.Unsetenv("SEED_DEMO_DATA")
		}
	})

	t.Setenv("DB_DRIVER", "sqlite")
	t.Setenv("DATABASE_URL", "unifind-dev.db")
	t.Setenv("GIN_MODE", "debug")
	if !localDemoSeedEnabled() {
		t.Fatal("expected local SQLite debug mode to enable demo seed by default")
	}
}

func ownerIDForSeedTest(t *testing.T, db *gorm.DB) uint {
	t.Helper()
	var owner models.User
	if err := db.Where("email = ?", "user@dntu.edu.vn").First(&owner).Error; err != nil {
		t.Fatalf("find demo owner: %v", err)
	}
	return owner.ID
}
