package database

import (
	"fmt"
	"log"
	"os"
	"strings"

	"unifind-dntu/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	var err error
	driver := strings.ToLower(os.Getenv("DB_DRIVER"))
	dbURL := os.Getenv("DATABASE_URL")

	if dbURL == "" {
		dbURL = "unifind.db"
	}

	if driver == "postgres" || strings.HasPrefix(dbURL, "postgres://") {
		DB, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
		if err != nil {
			log.Printf("[DB Warning] Failed to connect to Postgres (%v). Falling back to SQLite.", err)
			driver = "sqlite"
		} else {
			log.Println("[DB] Connected to PostgreSQL successfully")
		}
	}

	if DB == nil || driver == "sqlite" {
		sqliteFile := dbURL
		if strings.HasPrefix(sqliteFile, "postgres://") || sqliteFile == "" {
			sqliteFile = "unifind.db"
		}
		DB, err = gorm.Open(sqlite.Open(sqliteFile), &gorm.Config{})
		if err != nil {
			log.Fatalf("[DB Fatal] Failed to connect to SQLite: %v", err)
		}
		log.Printf("[DB] Connected to SQLite successfully (%s)", sqliteFile)
	}

	err = AutoMigrate(DB)
	if err != nil {
		log.Fatalf("[DB Fatal] Migration failed: %v", err)
	}

	return DB
}

func AutoMigrate(db *gorm.DB) error {
	fmt.Println("[DB] Running AutoMigrate for models...")
	return db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Location{},
		&models.Item{},
		&models.ItemImage{},
		&models.Claim{},
		&models.ClaimEvidence{},
		&models.HandoverRecord{},
		&models.Notification{},
		&models.AuditLog{},
		&models.Match{},
	)
}
