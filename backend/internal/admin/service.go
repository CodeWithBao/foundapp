package admin

import (
	"fmt"
	"time"

	"unifind-dntu/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type AdminService interface {
	GetStats() (*AdminStatsDTO, error)
	GetUsers(page, limit int, search string) ([]models.User, int64, error)
	UpdateUserStatus(adminID uint, targetUserID uint, status string, role string, ip string) error
	ResetUserPassword(adminID uint, targetUserID uint, ip string) error
	GetAuditLogs(page, limit int) ([]models.AuditLog, int64, error)
}

type adminService struct {
	repo AdminRepository
}

func NewAdminService(repo AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) GetStats() (*AdminStatsDTO, error) {
	return s.repo.GetStats()
}

func (s *adminService) GetUsers(page, limit int, search string) ([]models.User, int64, error) {
	return s.repo.GetAllUsers(page, limit, search)
}

func (s *adminService) UpdateUserStatus(adminID uint, targetUserID uint, status string, role string, ip string) error {
	if err := s.repo.UpdateUserStatus(targetUserID, status, role); err != nil {
		return err
	}

	desc := fmt.Sprintf("Changed user #%d status to %s", targetUserID, status)
	if role != "" {
		desc += fmt.Sprintf(", role to %s", role)
	}

	audit := models.AuditLog{
		UserID:      adminID,
		Action:      "UPDATE_USER_STATUS",
		Entity:      "USER",
		EntityID:    targetUserID,
		Description: desc,
		IPAddress:   ip,
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateAuditLog(&audit)

	return nil
}

func (s *adminService) ResetUserPassword(adminID uint, targetUserID uint, ip string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateUserPassword(targetUserID, string(hash)); err != nil {
		return err
	}

	audit := models.AuditLog{
		UserID:      adminID,
		Action:      "RESET_USER_PASSWORD",
		Entity:      "USER",
		EntityID:    targetUserID,
		Description: fmt.Sprintf("Reset password for user #%d to the system default", targetUserID),
		IPAddress:   ip,
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateAuditLog(&audit)
	return nil
}

func (s *adminService) GetAuditLogs(page, limit int) ([]models.AuditLog, int64, error) {
	return s.repo.GetAuditLogs(page, limit)
}
