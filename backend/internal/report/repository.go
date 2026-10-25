package report

import (
	"errors"

	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type ReportRepository interface {
	Create(report *models.Report) error
	FindByPostAndReporter(postID, reporterID uint) (*models.Report, error)
	FindByID(id uint) (*models.Report, error)
	FindAll(status, reason string, page, limit int) ([]models.Report, int64, error)
	GetPostReportCount(postID uint) (int64, error)
	Update(report *models.Report) error
	Delete(id uint) error
	ToggleItemHidden(postID uint, isHidden bool) error
	DeleteItem(postID uint) error
}

type reportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) Create(report *models.Report) error {
	return r.db.Create(report).Error
}

func (r *reportRepository) FindByPostAndReporter(postID, reporterID uint) (*models.Report, error) {
	var rep models.Report
	err := r.db.Where("post_id = ? AND reporter_id = ?", postID, reporterID).First(&rep).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rep, nil
}

func (r *reportRepository) FindByID(id uint) (*models.Report, error) {
	var rep models.Report
	err := r.db.Preload("Item").Preload("Item.User").Preload("Item.Images").Preload("Reporter").Preload("Handler").First(&rep, id).Error
	if err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *reportRepository) FindAll(status, reason string, page, limit int) ([]models.Report, int64, error) {
	var reports []models.Report
	var total int64

	query := r.db.Model(&models.Report{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if reason != "" {
		query = query.Where("reason = ?", reason)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Preload("Item").Preload("Item.User").Preload("Item.Images").Preload("Reporter").Preload("Handler").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&reports).Error
	if err != nil {
		return nil, 0, err
	}

	return reports, total, nil
}

func (r *reportRepository) GetPostReportCount(postID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Report{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}

func (r *reportRepository) Update(report *models.Report) error {
	return r.db.Save(report).Error
}

func (r *reportRepository) Delete(id uint) error {
	return r.db.Delete(&models.Report{}, id).Error
}

func (r *reportRepository) ToggleItemHidden(postID uint, isHidden bool) error {
	return r.db.Model(&models.Item{}).Where("id = ?", postID).Update("is_hidden", isHidden).Error
}

func (r *reportRepository) DeleteItem(postID uint) error {
	return r.db.Delete(&models.Item{}, postID).Error
}
