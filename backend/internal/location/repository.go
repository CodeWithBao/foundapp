package location

import (
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type LocationRepository interface {
	FindAll() ([]models.Location, error)
	FindByID(id uint) (*models.Location, error)
	Create(loc *models.Location) error
	Update(loc *models.Location) error
	Delete(id uint) error
}

type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) FindAll() ([]models.Location, error) {
	var locs []models.Location
	err := r.db.Find(&locs).Error
	return locs, err
}

func (r *locationRepository) FindByID(id uint) (*models.Location, error) {
	var loc models.Location
	err := r.db.First(&loc, id).Error
	if err != nil {
		return nil, err
	}
	return &loc, nil
}

func (r *locationRepository) Create(loc *models.Location) error {
	return r.db.Create(loc).Error
}

func (r *locationRepository) Update(loc *models.Location) error {
	return r.db.Save(loc).Error
}

func (r *locationRepository) Delete(id uint) error {
	return r.db.Delete(&models.Location{}, id).Error
}
