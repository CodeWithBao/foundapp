package claim

import (
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type ClaimRepository interface {
	FindAll(status string, claimantID uint, itemID uint) ([]models.Claim, error)
	FindByID(id uint) (*models.Claim, error)
	FindAllHandovers() ([]models.HandoverRecord, error)
}

type claimRepository struct {
	db *gorm.DB
}

func NewClaimRepository(db *gorm.DB) ClaimRepository {
	return &claimRepository{db: db}
}

func (r *claimRepository) FindAll(status string, claimantID uint, itemID uint) ([]models.Claim, error) {
	query := r.db.Preload("Item").Preload("Claimant").Preload("Reviewer")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if claimantID > 0 {
		query = query.Where("claimant_id = ?", claimantID)
	}
	if itemID > 0 {
		query = query.Where("item_id = ?", itemID)
	}
	var claims []models.Claim
	err := query.Order("created_at desc").Find(&claims).Error
	return claims, err
}

func (r *claimRepository) FindByID(id uint) (*models.Claim, error) {
	var claim models.Claim
	err := r.db.Preload("Item").Preload("Claimant").Preload("Reviewer").Preload("Evidences").First(&claim, id).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *claimRepository) FindAllHandovers() ([]models.HandoverRecord, error) {
	var records []models.HandoverRecord
	err := r.db.Preload("Claim").Preload("Item").Preload("Recipient").Preload("Staff").Order("created_at desc").Find(&records).Error
	return records, err
}
