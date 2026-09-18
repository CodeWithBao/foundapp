package admin

import (
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type AdminRepository interface {
	GetStats() (*AdminStatsDTO, error)
	GetAllUsers(page, limit int, search string) ([]models.User, int64, error)
	UpdateUserStatus(userID uint, status string, role string) error
	UpdateUserPassword(userID uint, passwordHash string) error
	GetAuditLogs(page, limit int) ([]models.AuditLog, int64, error)
	CreateAuditLog(log *models.AuditLog) error
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) GetStats() (*AdminStatsDTO, error) {
	var stats AdminStatsDTO

	r.db.Model(&models.User{}).Count(&stats.TotalUsers)
	r.db.Model(&models.Item{}).Where("type = ?", models.ItemTypeLost).Count(&stats.TotalLostItems)
	r.db.Model(&models.Item{}).Where("type = ?", models.ItemTypeFound).Count(&stats.TotalFoundItems)
	r.db.Model(&models.Item{}).Where("status = ?", models.ItemStatusReturned).Count(&stats.TotalReturnedItems)
	r.db.Model(&models.Claim{}).Count(&stats.TotalClaims)
	r.db.Model(&models.Claim{}).Where("status = ?", models.ClaimStatusPending).Count(&stats.TotalPendingClaims)

	return &stats, nil
}

func (r *adminRepository) GetAllUsers(page, limit int, search string) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	query := r.db.Model(&models.User{})
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("name LIKE ? OR email LIKE ? OR student_id LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&users).Error
	return users, total, err
}

func (r *adminRepository) UpdateUserStatus(userID uint, status string, role string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if role != "" {
		updates["role"] = role
	}
	return r.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error
}

func (r *adminRepository) UpdateUserPassword(userID uint, passwordHash string) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", passwordHash).Error
}

func (r *adminRepository) GetAuditLogs(page, limit int) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := r.db.Model(&models.AuditLog{})
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&logs).Error
	return logs, total, err
}

func (r *adminRepository) CreateAuditLog(log *models.AuditLog) error {
	return r.db.Create(log).Error
}
