package report

import (
	"errors"
	"time"

	"unifind-dntu/internal/models"
)

type ReportService interface {
	CreateReport(reporterID uint, dto CreateReportDTO) (*models.Report, error)
	GetAllReports(status, reason string, page, limit int) ([]models.Report, int64, error)
	UpdateReportStatus(adminID, reportID uint, status models.ReportStatus, note string) error
	TogglePostHidden(reportID uint, isHidden bool, adminID uint, reason string) error
	DeletePost(reportID uint, adminID uint) error
	GetPostReportCount(postID uint) (int64, error)
}

type reportService struct {
	repo ReportRepository
}

func NewReportService(repo ReportRepository) ReportService {
	return &reportService{repo: repo}
}

func (s *reportService) CreateReport(reporterID uint, dto CreateReportDTO) (*models.Report, error) {
	existing, err := s.repo.FindByPostAndReporter(dto.PostID, reporterID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("bạn đã báo cáo bài đăng này rồi")
	}

	report := &models.Report{
		PostID:      dto.PostID,
		ReporterID:  reporterID,
		Reason:      dto.Reason,
		Description: dto.Description,
		Status:      models.ReportStatusPending,
	}

	if err := s.repo.Create(report); err != nil {
		return nil, err
	}
	return report, nil
}

func (s *reportService) GetAllReports(status, reason string, page, limit int) ([]models.Report, int64, error) {
	return s.repo.FindAll(status, reason, page, limit)
}

func (s *reportService) UpdateReportStatus(adminID, reportID uint, status models.ReportStatus, note string) error {
	report, err := s.repo.FindByID(reportID)
	if err != nil {
		return err
	}

	now := time.Now()
	report.Status = status
	report.AdminNote = note
	report.HandledBy = &adminID
	report.HandledAt = &now

	return s.repo.Update(report)
}

func (s *reportService) TogglePostHidden(reportID uint, isHidden bool, adminID uint, reason string) error {
	report, err := s.repo.FindByID(reportID)
	if err != nil {
		return err
	}

	if err := s.repo.ToggleItemHidden(report.PostID, isHidden); err != nil {
		return err
	}

	now := time.Now()
	report.Status = models.ReportStatusResolved
	if !isHidden {
		report.AdminNote = "Đã khôi phục bài đăng"
	} else {
		report.AdminNote = "Đã ẩn bài đăng: " + reason
	}
	report.HandledBy = &adminID
	report.HandledAt = &now

	return s.repo.Update(report)
}

func (s *reportService) DeletePost(reportID uint, adminID uint) error {
	report, err := s.repo.FindByID(reportID)
	if err != nil {
		return err
	}

	if err := s.repo.DeleteItem(report.PostID); err != nil {
		return err
	}

	now := time.Now()
	report.Status = models.ReportStatusResolved
	report.AdminNote = "Đã xóa bài đăng vi phạm"
	report.HandledBy = &adminID
	report.HandledAt = &now

	return s.repo.Update(report)
}

func (s *reportService) GetPostReportCount(postID uint) (int64, error) {
	return s.repo.GetPostReportCount(postID)
}
