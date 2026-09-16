package location

import (
	"errors"

	"unifind-dntu/internal/models"
)

type LocationService interface {
	GetAllLocations() ([]models.Location, error)
	GetLocationByID(id uint) (*models.Location, error)
	CreateLocation(loc *models.Location) error
	UpdateLocation(id uint, updated *models.Location) (*models.Location, error)
	DeleteLocation(id uint) error
}

type locationService struct {
	repo LocationRepository
}

func NewLocationService(repo LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func (s *locationService) GetAllLocations() ([]models.Location, error) {
	return s.repo.FindAll()
}

func (s *locationService) GetLocationByID(id uint) (*models.Location, error) {
	return s.repo.FindByID(id)
}

func (s *locationService) CreateLocation(loc *models.Location) error {
	if loc.Name == "" || loc.Code == "" {
		return errors.New("name and code are required")
	}
	return s.repo.Create(loc)
}

func (s *locationService) UpdateLocation(id uint, updated *models.Location) (*models.Location, error) {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if updated.Name != "" {
		existing.Name = updated.Name
	}
	if updated.Code != "" {
		existing.Code = updated.Code
	}
	if updated.Description != "" {
		existing.Description = updated.Description
	}
	existing.IsActive = updated.IsActive

	if err := s.repo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *locationService) DeleteLocation(id uint) error {
	return s.repo.Delete(id)
}
