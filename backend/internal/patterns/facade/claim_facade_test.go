package facade

import (
	"testing"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/observer"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	_ = db.AutoMigrate(
		&models.User{},
		&models.Item{},
		&models.ItemImage{},
		&models.Claim{},
		&models.ClaimEvidence{},
		&models.HandoverRecord{},
		&models.Notification{},
		&models.AuditLog{},
	)
	return db
}

func TestClaimFacade_SubmitClaim_CannotClaimOwnItem(t *testing.T) {
	db := setupTestDB()
	notifier := &observer.Subject{}
	cf := NewClaimFacade(db, notifier)

	ownerID := uint(1)
	item := models.Item{
		Title:  "Laptop Asus Vivobook",
		Type:   models.ItemTypeFound,
		Status: models.ItemStatusFound,
		UserID: ownerID,
	}
	db.Create(&item)

	_, err := cf.SubmitClaim(ownerID, item.ID, "Của tôi", "Chi tiết", nil)
	if err == nil {
		t.Fatalf("Expected error when claiming own item, got nil")
	}
}

func TestClaimFacade_SubmitClaim_Success(t *testing.T) {
	db := setupTestDB()
	notifier := &observer.Subject{}
	cf := NewClaimFacade(db, notifier)

	finderID := uint(1)
	claimantID := uint(2)
	item := models.Item{
		Title:  "Ví da nam",
		Type:   models.ItemTypeFound,
		Status: models.ItemStatusFound,
		UserID: finderID,
	}
	db.Create(&item)

	claim, err := cf.SubmitClaim(claimantID, item.ID, "Tôi làm rơi ở nhà A", "Bên trong có CCCD", []string{"evidence.jpg"})
	if err != nil {
		t.Fatalf("Expected claim creation success, got %v", err)
	}
	if claim.Status != models.ClaimStatusPending {
		t.Errorf("Expected status PENDING, got %s", claim.Status)
	}
}

func TestClaimFacade_SubmitClaim_DuplicateForbidden(t *testing.T) {
	db := setupTestDB()
	notifier := &observer.Subject{}
	cf := NewClaimFacade(db, notifier)

	finderID := uint(1)
	claimantID := uint(2)
	item := models.Item{
		Title:  "Tai nghe AirPods",
		Type:   models.ItemTypeFound,
		Status: models.ItemStatusFound,
		UserID: finderID,
	}
	db.Create(&item)

	_, err := cf.SubmitClaim(claimantID, item.ID, "Yêu cầu 1", "Chi tiết 1", nil)
	if err != nil {
		t.Fatalf("Expected first claim success, got %v", err)
	}

	_, err2 := cf.SubmitClaim(claimantID, item.ID, "Yêu cầu 2", "Chi tiết 2", nil)
	if err2 == nil {
		t.Fatalf("Expected duplicate claim error, got nil")
	}
}

func TestClaimFacade_ProcessClaimReview_Approve(t *testing.T) {
	db := setupTestDB()
	notifier := &observer.Subject{}
	cf := NewClaimFacade(db, notifier)

	finderID := uint(1)
	claimantID := uint(2)
	staffID := uint(3)

	item := models.Item{
		Title:  "Đồng hồ Casio",
		Type:   models.ItemTypeFound,
		Status: models.ItemStatusFound,
		UserID: finderID,
	}
	db.Create(&item)

	claim, _ := cf.SubmitClaim(claimantID, item.ID, "Của tôi", "Trầy xước mặt sau", nil)

	err := cf.ApproveClaim(claim.ID, staffID, "Khớp thông tin")
	if err != nil {
		t.Fatalf("Expected approve claim success, got %v", err)
	}

	var updatedClaim models.Claim
	db.First(&updatedClaim, claim.ID)
	if updatedClaim.Status != models.ClaimStatusApproved {
		t.Errorf("Expected status APPROVED, got %s", updatedClaim.Status)
	}
}

func TestClaimFacade_Handover_Success(t *testing.T) {
	db := setupTestDB()
	notifier := &observer.Subject{}
	cf := NewClaimFacade(db, notifier)

	finderID := uint(1)
	claimantID := uint(2)
	staffID := uint(3)

	item := models.Item{
		Title:  "Căn cước công dân",
		Type:   models.ItemTypeFound,
		Status: models.ItemStatusFound,
		UserID: finderID,
	}
	db.Create(&item)

	claim, _ := cf.SubmitClaim(claimantID, item.ID, "CCCD của tôi", "Số 0123456789", nil)
	_ = cf.ApproveClaim(claim.ID, staffID, "Duyệt")

	record, err := cf.Handover(claim.ID, staffID, "Nguyễn Văn B", "DNTU-123", "Văn phòng Đoàn", "Đã ký nhận")
	if err != nil {
		t.Fatalf("Expected handover success, got %v", err)
	}
	if record.RecipientName != "Nguyễn Văn B" {
		t.Errorf("Expected recipient name Nguyễn Văn B, got %s", record.RecipientName)
	}

	var updatedItem models.Item
	db.First(&updatedItem, item.ID)
	if updatedItem.Status != models.ItemStatusReturned {
		t.Errorf("Expected item status RETURNED, got %s", updatedItem.Status)
	}
}
