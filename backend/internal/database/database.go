package database

import (
	"fmt"
	"log"
	"os"
	"strings"

	"unifind-dntu/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	var err error
	driver := strings.ToLower(os.Getenv("DB_DRIVER"))
	dbURL := os.Getenv("DATABASE_URL")

	if driver == "postgres" || strings.HasPrefix(dbURL, "postgres://") || strings.HasPrefix(dbURL, "host=") {
		if dbURL == "" {
			host := os.Getenv("DB_HOST")
			if host == "" {
				host = "localhost"
			}
			port := os.Getenv("DB_PORT")
			if port == "" {
				port = "5432"
			}
			user := os.Getenv("DB_USER")
			if user == "" {
				user = "unifind"
			}
			pass := os.Getenv("DB_PASSWORD")
			if pass == "" {
				pass = "unifind_password"
			}
			name := os.Getenv("DB_NAME")
			if name == "" {
				name = "unifind_db"
			}
			dbURL = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", host, user, pass, name, port)
		}
		DB, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
		if err != nil {
			if os.Getenv("ALLOW_SQLITE_FALLBACK") == "true" {
				log.Printf("[DB Warning] Failed to connect to Postgres (%v). Falling back to SQLite.", err)
				driver = "sqlite"
			} else {
				log.Fatalf("[DB Fatal] Failed to connect to PostgreSQL: %v", err)
			}
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
		&models.Report{},
	)
}
