package database

import (
	"log"
	"time"

	"unifind-dntu/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedData(db *gorm.DB) {
	seedUsers(db)
	seedCategories(db)
	seedLocations(db)
	seedItems(db)
	seedClaims(db)
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
			Name:         "Nguyễn Văn An",
			Email:        "user@dntu.edu.vn",
			PasswordHash: hashPassword("123456"),
			Role:         models.RoleUser,
			StudentID:    "SV20210001",
		},
		{
			Name:         "Trần Minh Tuấn",
			Email:        "staff@dntu.edu.vn",
			PasswordHash: hashPassword("123456"),
			Role:         models.RoleStaff,
		},
		{
			Name:         "Admin UniFind",
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
	categories := []models.Category{
		{Name: "Điện thoại", Slug: "dien-thoai", Icon: "smartphone"},
		{Name: "Laptop", Slug: "laptop", Icon: "laptop"},
		{Name: "Tai nghe", Slug: "tai-nghe", Icon: "headphones"},
		{Name: "Ví / Bóp", Slug: "vi-bop", Icon: "wallet"},
		{Name: "Thẻ sinh viên", Slug: "the-sinh-vien", Icon: "credit-card"},
		{Name: "Chìa khóa", Slug: "chia-khoa", Icon: "key"},
		{Name: "Balo / Túi xách", Slug: "balo-tui-xach", Icon: "briefcase"},
		{Name: "Bình nước", Slug: "binh-nuoc", Icon: "bottle"},
		{Name: "Kính", Slug: "kinh", Icon: "glasses"},
		{Name: "Sách / Tài liệu", Slug: "sach-tai-lieu", Icon: "book"},
		{Name: "Đồng hồ", Slug: "dong-ho", Icon: "watch"},
		{Name: "Quần áo", Slug: "quan-ao", Icon: "shirt"},
		{Name: "Thiết bị điện tử", Slug: "thiet-bi-dien-tu", Icon: "zap"},
		{Name: "Khác", Slug: "khac", Icon: "box"},
	}

	for _, c := range categories {
		var existing models.Category
		if err := db.Where("name = ? OR slug = ?", c.Name, c.Slug).First(&existing).Error; err != nil {
			db.Create(&c)
		}
	}
	log.Println("[Seed] Categories checked and seeded.")
}

func seedLocations(db *gorm.DB) {
	locations := []models.Location{
		{Name: "Nhà A", Code: "NHA_A"},
		{Name: "Nhà B", Code: "NHA_B"},
		{Name: "Nhà C", Code: "NHA_C"},
		{Name: "Giảng đường A", Code: "GD_A"},
		{Name: "Giảng đường B", Code: "GD_B"},
		{Name: "Giảng đường C", Code: "GD_C"},
		{Name: "Thư viện", Code: "THU_VIEN"},
		{Name: "Căng tin", Code: "CANG_TIN"},
		{Name: "Sân thể thao", Code: "SAN_THE_THAO"},
		{Name: "Bãi xe", Code: "BAI_XE"},
		{Name: "Phòng Lab", Code: "PHONG_LAB"},
		{Name: "Ký túc xá", Code: "KY_TUC_XA"},
		{Name: "Hội trường", Code: "HOI_TRUONG"},
		{Name: "Phòng tự học", Code: "PHONG_TU_HOC"},
	}

	for _, l := range locations {
		var existing models.Location
		if err := db.Where("name = ? OR code = ?", l.Name, l.Code).First(&existing).Error; err != nil {
			db.Create(&l)
		}
	}
	log.Println("[Seed] Locations checked and seeded.")
}

type rawSeedItem struct {
	Title            string
	Category         string
	Type             models.ItemType
	Status           models.ItemStatus
	Location         string
	Date             string
	Description      string
	Color            string
	Brand            string
	DistinctFeatures string
	Image            string
	Views            int
	StorageLocation  string
	CreatedAt        string
}

func seedItems(db *gorm.DB) {
	var count int64
	db.Model(&models.Item{}).Count(&count)
	if count > 0 {
		return
	}

	const (
		imgPhone1      = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop"
		imgPhone2      = "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop"
		imgLaptop1     = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop"
		imgLaptop2     = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop"
		imgEarphone1   = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
		imgEarphone2   = "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=300&fit=crop"
		imgWallet1     = "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop"
		imgWallet2     = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"
		imgCard        = "https://images.unsplash.com/photo-1578670812003-60745e2c2ea9?w=400&h=300&fit=crop"
		imgKeys1       = "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop"
		imgKeys2       = "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop"
		imgBag1        = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
		imgBag2        = "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=400&h=300&fit=crop"
		imgBottle      = "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop"
		imgGlasses1    = "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=300&fit=crop"
		imgGlasses2    = "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop"
		imgBook        = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop"
		imgWatch1      = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop"
		imgWatch2      = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop"
		imgClothes     = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop"
		imgElectronics = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop"
	)

	rawItems := []rawSeedItem{
		{
			Title: "Ví da màu đen", Category: "Ví / Bóp", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Thư viện", Date: "2026-09-12", Description: "Ví da màu đen, bên trong có thẻ sinh viên và một số giấy tờ cá nhân. Ví hiệu Montblanc, có khắc tên chủ sở hữu bên trong.",
			Color: "Đen", Brand: "Montblanc", DistinctFeatures: "Có khắc tên Nguyễn Văn An bên trong",
			Image: imgWallet1, Views: 45, StorageLocation: "", CreatedAt: "2026-09-12T08:30:00Z",
		},
		{
			Title: "Tai nghe AirPods Pro", Category: "Tai nghe", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Nhà C", Date: "2026-09-11", Description: "Tai nghe AirPods Pro màu trắng, còn trong hộp sạc. Tìm thấy trên bàn phòng C305.",
			Color: "Trắng", Brand: "Apple", DistinctFeatures: "Có khắc chữ trên hộp sạc",
			Image: imgEarphone1, Views: 67, StorageLocation: "Bộ phận Lost & Found", CreatedAt: "2026-09-11T14:20:00Z",
		},
		{
			Title: "Thẻ sinh viên Nguyễn Minh Anh", Category: "Thẻ sinh viên", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Giảng đường A", Date: "2026-09-10", Description: "Thẻ sinh viên mang tên Nguyễn Minh Anh, mã SV20210156. Mất tại giảng đường A sau buổi học sáng.",
			Color: "", Brand: "", DistinctFeatures: "Mã SV20210156",
			Image: imgCard, Views: 32, StorageLocation: "", CreatedAt: "2026-09-10T11:00:00Z",
		},
		{
			Title: "Chìa khóa xe Honda", Category: "Chìa khóa", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Bãi xe", Date: "2026-09-09", Description: "Chìa khóa xe Honda Wave, có móc khóa hình gấu bông nhỏ màu nâu.",
			Color: "", Brand: "Honda", DistinctFeatures: "Móc khóa hình gấu bông nâu",
			Image: imgKeys1, Views: 89, StorageLocation: "Bảo vệ bãi xe", CreatedAt: "2026-09-09T16:45:00Z",
		},
		{
			Title: "iPhone 14 Pro Max", Category: "Điện thoại", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Giảng đường B", Date: "2026-09-08", Description: "iPhone 14 Pro Max màu đen, có ốp lưng trong suốt. Mất sau giờ học chiều thứ 6.",
			Color: "Đen", Brand: "Apple", DistinctFeatures: "Ốp lưng trong suốt, có sticker nhỏ mặt sau",
			Image: imgPhone1, Views: 120, StorageLocation: "", CreatedAt: "2026-09-08T17:30:00Z",
		},
		{
			Title: "Kính cận gọng đen", Category: "Kính", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Thư viện", Date: "2026-09-08", Description: "Kính cận gọng nhựa đen, tròng kính khá dày. Tìm thấy trên bàn đọc tầng 2 thư viện.",
			Color: "Đen", Brand: "", DistinctFeatures: "Gọng nhựa, tròng dày",
			Image: imgGlasses1, Views: 28, StorageLocation: "Phòng bảo vệ", CreatedAt: "2026-09-08T09:15:00Z",
		},
		{
			Title: "Balo Adidas màu xám", Category: "Balo / Túi xách", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Nhà C", Date: "2026-09-07", Description: "Balo Adidas màu xám, bên trong có vở và bút. Để quên tại phòng C201.",
			Color: "Xám", Brand: "Adidas", DistinctFeatures: "Có dán sticker DNTU trên quai",
			Image: imgBag1, Views: 55, StorageLocation: "", CreatedAt: "2026-09-07T13:00:00Z",
		},
		{
			Title: "Chìa khóa nhà có móc kim loại", Category: "Chìa khóa", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Căng tin", Date: "2026-09-07", Description: "Bộ chìa khóa nhà gồm 3 chìa, có móc kim loại hình tròn.",
			Color: "", Brand: "", DistinctFeatures: "Móc kim loại tròn, 3 chìa",
			Image: imgKeys2, Views: 41, StorageLocation: "Văn phòng Đoàn trường", CreatedAt: "2026-09-07T12:00:00Z",
		},
		{
			Title: "Bình nước Lock&Lock xanh", Category: "Bình nước", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Sân thể thao", Date: "2026-09-06", Description: "Bình nước Lock&Lock 750ml màu xanh dương, có dán tên trên thân bình.",
			Color: "Xanh dương", Brand: "Lock&Lock", DistinctFeatures: "Có dán tên Phúc trên thân",
			Image: imgBottle, Views: 18, StorageLocation: "", CreatedAt: "2026-09-06T17:00:00Z",
		},
		{
			Title: "Ví da màu nâu", Category: "Ví / Bóp", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Nhà A", Date: "2026-09-06", Description: "Ví da màu nâu, bên trong có ít tiền mặt và thẻ ATM. Tìm thấy ở hành lang tầng 3.",
			Color: "Nâu", Brand: "", DistinctFeatures: "Có chữ cái khắc trên ví",
			Image: imgWallet2, Views: 73, StorageLocation: "Bộ phận Lost & Found", CreatedAt: "2026-09-06T10:30:00Z",
		},
		{
			Title: "Laptop Dell Inspiron 15", Category: "Laptop", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Phòng tự học", Date: "2026-09-05", Description: "Laptop Dell Inspiron 15 màu bạc, có dán sticker trên nắp. Để quên tại phòng tự học.",
			Color: "Bạc", Brand: "Dell", DistinctFeatures: "Có dán sticker anime trên nắp",
			Image: imgLaptop1, Views: 95, StorageLocation: "", CreatedAt: "2026-09-05T20:00:00Z",
		},
		{
			Title: "Đồng hồ Casio G-Shock", Category: "Đồng hồ", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Sân thể thao", Date: "2026-09-05", Description: "Đồng hồ Casio G-Shock màu đen, tìm thấy tại sân bóng rổ.",
			Color: "Đen", Brand: "Casio", DistinctFeatures: "G-Shock, dây nhựa đen",
			Image: imgWatch1, Views: 36, StorageLocation: "Bảo vệ sân thể thao", CreatedAt: "2026-09-05T18:00:00Z",
		},
		{
			Title: "Sách Giải tích 1", Category: "Sách / Tài liệu", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Giảng đường A", Date: "2026-09-04", Description: "Sách Giải tích 1 (NXB Đại học Quốc gia), có ghi chú bằng bút chì bên trong.",
			Color: "", Brand: "", DistinctFeatures: "Nhiều ghi chú bút chì, trang 45 bị gấp góc",
			Image: imgBook, Views: 12, StorageLocation: "", CreatedAt: "2026-09-04T09:00:00Z",
		},
		{
			Title: "Áo khoác Nike xám", Category: "Quần áo", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Hội trường", Date: "2026-09-04", Description: "Áo khoác Nike màu xám, size L. Để quên trên ghế sau sự kiện.",
			Color: "Xám", Brand: "Nike", DistinctFeatures: "Size L, có vết mực nhỏ ở tay trái",
			Image: imgClothes, Views: 22, StorageLocation: "Phòng bảo vệ", CreatedAt: "2026-09-04T21:00:00Z",
		},
		{
			Title: "Samsung Galaxy S23", Category: "Điện thoại", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Căng tin", Date: "2026-09-03", Description: "Samsung Galaxy S23 màu tím, có ốp lưng silicon. Để quên trên bàn ăn.",
			Color: "Tím", Brand: "Samsung", DistinctFeatures: "Ốp silicon tím nhạt, có pop socket",
			Image: imgPhone2, Views: 88, StorageLocation: "", CreatedAt: "2026-09-03T12:30:00Z",
		},
		{
			Title: "USB Kingston 32GB", Category: "Thiết bị điện tử", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Phòng Lab", Date: "2026-09-03", Description: "USB Kingston 32GB màu đen, cắm quên ở máy tính Lab.",
			Color: "Đen", Brand: "Kingston", DistinctFeatures: "Có dán nhãn tên",
			Image: imgElectronics, Views: 15, StorageLocation: "Phòng Lab", CreatedAt: "2026-09-03T16:00:00Z",
		},
		{
			Title: "Túi xách Zara nâu", Category: "Balo / Túi xách", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Ký túc xá", Date: "2026-09-02", Description: "Túi xách Zara màu nâu, bên trong có ví nhỏ và mỹ phẩm.",
			Color: "Nâu", Brand: "Zara", DistinctFeatures: "Có khóa kim loại vàng",
			Image: imgBag2, Views: 44, StorageLocation: "", CreatedAt: "2026-09-02T14:00:00Z",
		},
		{
			Title: "Tai nghe Sony WH-1000XM5", Category: "Tai nghe", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Thư viện", Date: "2026-09-02", Description: "Tai nghe chụp tai Sony WH-1000XM5 màu đen, tìm thấy trong phòng đọc.",
			Color: "Đen", Brand: "Sony", DistinctFeatures: "Có tên viết tay trên headband",
			Image: imgEarphone2, Views: 51, StorageLocation: "Bộ phận Lost & Found", CreatedAt: "2026-09-02T11:00:00Z",
		},
		{
			Title: "Thẻ sinh viên Lê Hoàng Dũng", Category: "Thẻ sinh viên", Type: models.ItemTypeFound, Status: models.ItemStatusReturned,
			Location: "Nhà B", Date: "2026-09-01", Description: "Thẻ sinh viên mang tên Lê Hoàng Dũng, mã SV20210089.",
			Color: "", Brand: "", DistinctFeatures: "Mã SV20210089",
			Image: imgCard, Views: 25, StorageLocation: "Đã bàn giao", CreatedAt: "2026-09-01T08:00:00Z",
		},
		{
			Title: "Bình nước Inox 500ml", Category: "Bình nước", Type: models.ItemTypeFound, Status: models.ItemStatusReturned,
			Location: "Giảng đường C", Date: "2026-08-30", Description: "Bình nước inox 500ml có nắp xanh lá, tìm thấy dưới bàn.",
			Color: "Bạc", Brand: "", DistinctFeatures: "Nắp xanh lá, có vết trầy nhỏ",
			Image: imgBottle, Views: 19, StorageLocation: "Đã bàn giao", CreatedAt: "2026-08-30T15:00:00Z",
		},
		{
			Title: "MacBook Air M2", Category: "Laptop", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Phòng tự học", Date: "2026-09-01", Description: "MacBook Air M2 màu Midnight, để quên tại phòng tự học tầng 3 thư viện.",
			Color: "Đen", Brand: "Apple", DistinctFeatures: "Có dán sticker Code is Life trên nắp",
			Image: imgLaptop2, Views: 134, StorageLocation: "Bộ phận Lost & Found", CreatedAt: "2026-09-01T20:00:00Z",
		},
		{
			Title: "Kính râm Ray-Ban", Category: "Kính", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Căng tin", Date: "2026-09-01", Description: "Kính râm Ray-Ban Wayfarer đen, để quên trên bàn căng tin.",
			Color: "Đen", Brand: "Ray-Ban", DistinctFeatures: "Wayfarer classic, tròng phân cực",
			Image: imgGlasses2, Views: 38, StorageLocation: "", CreatedAt: "2026-09-01T12:00:00Z",
		},
		{
			Title: "Ví da đen tìm thấy ở Thư viện", Category: "Ví / Bóp", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Thư viện", Date: "2026-09-12", Description: "Ví da màu đen, tìm thấy tại bàn đọc sách tầng 1 thư viện. Bên trong có thẻ sinh viên và giấy tờ.",
			Color: "Đen", Brand: "Montblanc", DistinctFeatures: "Có khắc tên bên trong",
			Image: imgWallet1, Views: 52, StorageLocation: "Bộ phận Lost & Found", CreatedAt: "2026-09-12T15:00:00Z",
		},
		{
			Title: "Sổ tay Moleskine đen", Category: "Sách / Tài liệu", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Nhà A", Date: "2026-08-28", Description: "Sổ tay Moleskine màu đen, bên trong có nhiều ghi chú quan trọng.",
			Color: "Đen", Brand: "Moleskine", DistinctFeatures: "Có bookmark đỏ, trang đầu ghi số điện thoại",
			Image: imgBook, Views: 16, StorageLocation: "", CreatedAt: "2026-08-28T10:00:00Z",
		},
		{
			Title: "Apple Watch Series 8", Category: "Đồng hồ", Type: models.ItemTypeLost, Status: models.ItemStatusReturned,
			Location: "Sân thể thao", Date: "2026-08-25", Description: "Apple Watch Series 8 dây silicon đen, rơi tại sân bóng đá.",
			Color: "Đen", Brand: "Apple", DistinctFeatures: "Dây silicon đen, mặt 45mm",
			Image: imgWatch2, Views: 78, StorageLocation: "Đã trả", CreatedAt: "2026-08-25T18:00:00Z",
		},
		{
			Title: "Cáp sạc USB-C", Category: "Thiết bị điện tử", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Phòng Lab", Date: "2026-09-10", Description: "Cáp sạc USB-C to USB-C dài 1m, màu trắng.",
			Color: "Trắng", Brand: "", DistinctFeatures: "",
			Image: imgElectronics, Views: 8, StorageLocation: "Phòng Lab", CreatedAt: "2026-09-10T14:00:00Z",
		},
		{
			Title: "Áo khoác DNTU", Category: "Quần áo", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Bãi xe", Date: "2026-09-09", Description: "Áo khoác đồng phục DNTU màu đỏ đô, size M. Để quên tại bãi xe.",
			Color: "Đỏ đô", Brand: "DNTU", DistinctFeatures: "Có thêu tên trên ngực trái",
			Image: imgClothes, Views: 15, StorageLocation: "Bãi xe", CreatedAt: "2026-09-09T07:30:00Z",
		},
		{
			Title: "Balo Herschel xanh đen", Category: "Balo / Túi xách", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Giảng đường B", Date: "2026-09-11", Description: "Balo Herschel màu xanh đen, bên trong có sách và bút.",
			Color: "Xanh đen", Brand: "Herschel", DistinctFeatures: "Có tag tên bên trong",
			Image: imgBag1, Views: 42, StorageLocation: "Bộ phận Lost & Found", CreatedAt: "2026-09-11T10:00:00Z",
		},
		{
			Title: "Chìa khóa xe Yamaha", Category: "Chìa khóa", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Nhà B", Date: "2026-09-13", Description: "Chìa khóa xe Yamaha Exciter, có móc khóa nhựa hình mèo.",
			Color: "", Brand: "Yamaha", DistinctFeatures: "Móc khóa nhựa hình mèo trắng",
			Image: imgKeys1, Views: 61, StorageLocation: "", CreatedAt: "2026-09-13T08:00:00Z",
		},
		{
			Title: "iPad Air 5", Category: "Thiết bị điện tử", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Hội trường", Date: "2026-09-14", Description: "iPad Air 5 màu Space Gray, có bao da màu xanh. Để quên sau buổi seminar.",
			Color: "Xám", Brand: "Apple", DistinctFeatures: "Bao da xanh dương, có Apple Pencil",
			Image: imgElectronics, Views: 93, StorageLocation: "", CreatedAt: "2026-09-14T16:00:00Z",
		},
		{
			Title: "Điện thoại Xiaomi Redmi Note 12", Category: "Điện thoại", Type: models.ItemTypeFound, Status: models.ItemStatusFound,
			Location: "Ký túc xá", Date: "2026-09-13", Description: "Xiaomi Redmi Note 12 màu xanh, tìm thấy tại khu vực giặt đồ KTX.",
			Color: "Xanh", Brand: "Xiaomi", DistinctFeatures: "Có ốp lưng xanh đậm, dán kính cường lực",
			Image: imgPhone2, Views: 33, StorageLocation: "KTX", CreatedAt: "2026-09-13T19:00:00Z",
		},
		{
			Title: "Đồng hồ Daniel Wellington", Category: "Đồng hồ", Type: models.ItemTypeLost, Status: models.ItemStatusLost,
			Location: "Nhà A", Date: "2026-09-14", Description: "Đồng hồ Daniel Wellington Classic mặt trắng, dây da nâu.",
			Color: "Nâu", Brand: "Daniel Wellington", DistinctFeatures: "Mặt 36mm, dây da nâu nhạt",
			Image: imgWatch2, Views: 27, StorageLocation: "", CreatedAt: "2026-09-14T10:00:00Z",
		},
	}

	var firstUser models.User
	db.First(&firstUser)
	userID := firstUser.ID
	if userID == 0 {
		userID = 1
	}

	for _, raw := range rawItems {
		var cat models.Category
		db.Where("name = ?", raw.Category).First(&cat)
		var loc models.Location
		db.Where("name = ?", raw.Location).First(&loc)

		catID := cat.ID
		if catID == 0 {
			var fallbackCat models.Category
			db.First(&fallbackCat)
			catID = fallbackCat.ID
		}

		locID := loc.ID
		if locID == 0 {
			var fallbackLoc models.Location
			db.First(&fallbackLoc)
			locID = fallbackLoc.ID
		}

		createdTime, _ := time.Parse(time.RFC3339, raw.CreatedAt)
		if createdTime.IsZero() {
			createdTime = time.Now()
		}

		item := models.Item{
			Title:                  raw.Title,
			Type:                   raw.Type,
			CategoryID:             catID,
			LocationID:             locID,
			Date:                   raw.Date,
			Description:            raw.Description,
			Color:                  raw.Color,
			Brand:                  raw.Brand,
			DistinctFeatures:       raw.DistinctFeatures,
			CurrentStorageLocation: raw.StorageLocation,
			Status:                 raw.Status,
			Views:                  raw.Views,
			UserID:                 userID,
			CreatedAt:              createdTime,
			UpdatedAt:              createdTime,
			Images: []models.ItemImage{
				{
					ImageURL:  raw.Image,
					IsPrimary: true,
				},
			},
		}

		db.Create(&item)
	}

	log.Printf("[Seed] %d items seeded successfully.", len(rawItems))
}

func seedClaims(db *gorm.DB) {
	var count int64
	db.Model(&models.Claim{}).Count(&count)
	if count > 0 {
		return
	}

	var items []models.Item
	db.Limit(5).Find(&items)
	if len(items) == 0 {
		return
	}

	var user models.User
	db.First(&user)

	claims := []models.Claim{
		{
			ItemID:        items[0].ID,
			ClaimantID:    user.ID,
			Reason:        "Đây là ví da đen của tôi, tôi bị mất ở Thư viện sáng ngày 12/09.",
			SecretDetails: "Bên trong có thẻ sinh viên mang tên Nguyễn Văn An.",
			Status:        models.ClaimStatusApproved,
			ReviewNote:    "Đã xác minh thẻ sinh viên và tên khắc trên ví.",
		},
		{
			ItemID:        items[1].ID,
			ClaimantID:    user.ID,
			Reason:        "Tai nghe AirPods Pro của tôi, mất ở nhà C hôm thứ 5.",
			SecretDetails: "Hộp sạc có khắc chữ T bằng laser ở mặt dưới.",
			Status:        models.ClaimStatusPending,
		},
	}

	for _, cl := range claims {
		db.Create(&cl)
	}
	log.Println("[Seed] Claims seeded successfully.")
}
