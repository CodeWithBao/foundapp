package database

import (
	"log"

	"unifind-dntu/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedData(db *gorm.DB) {
	seedUsers(db)
	seedCategories(db)
	seedLocations(db)
}

func seedUsers(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	hashPassword := func(password string) string {
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		return string(hash)
	}

	users := []models.User{
		{
			Name:         "Demo User",
			Email:        "user@dntu.edu.vn",
			PasswordHash: hashPassword("123456"),
			Role:         models.RoleUser,
			StudentID:    "DNTU-U001",
		},
		{
			Name:         "Demo Staff",
			Email:        "staff@dntu.edu.vn",
			PasswordHash: hashPassword("123456"),
			Role:         models.RoleStaff,
		},
		{
			Name:         "Demo Admin",
			Email:        "admin@dntu.edu.vn",
			PasswordHash: hashPassword("123456"),
			Role:         models.RoleAdmin,
		},
	}

	for _, u := range users {
		db.Create(&u)
	}
	log.Println("[Seed] Users seeded successfully.")
}

func seedCategories(db *gorm.DB) {
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
		return
	}

	categories := []models.Category{
		{Name: "Điện tử", Slug: "dien-tu", Icon: "smartphone"},
		{Name: "Giấy tờ/Thẻ", Slug: "giay-to-the", Icon: "credit-card"},
		{Name: "Đồ dùng cá nhân", Slug: "do-dung-ca-nhan", Icon: "briefcase"},
		{Name: "Phụ kiện", Slug: "phu-kien", Icon: "watch"},
		{Name: "Quần áo", Slug: "quan-ao", Icon: "shirt"},
	}

	for _, c := range categories {
		db.Create(&c)
	}
	log.Println("[Seed] Categories seeded successfully.")
}

func seedLocations(db *gorm.DB) {
	var count int64
	db.Model(&models.Location{}).Count(&count)
	if count > 0 {
		return
	}

	locations := []models.Location{
		{Name: "Nhà A", Code: "NHA_A"},
		{Name: "Nhà B", Code: "NHA_B"},
		{Name: "Nhà C", Code: "NHA_C"},
		{Name: "Thư viện", Code: "THU_VIEN"},
		{Name: "Căng tin", Code: "CANG_TIN"},
		{Name: "Bãi xe", Code: "BAI_XE"},
		{Name: "Hội trường", Code: "HOI_TRUONG"},
		{Name: "Sân thể thao", Code: "SAN_THE_THAO"},
		{Name: "Phòng Lab", Code: "PHONG_LAB"},
	}

	for _, l := range locations {
		db.Create(&l)
	}
	log.Println("[Seed] Locations seeded successfully.")
}
