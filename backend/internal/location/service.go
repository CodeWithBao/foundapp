package location

import (
	"errors"
	"strings"

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
	loc.Name = strings.TrimSpace(loc.Name)
	loc.Code = strings.TrimSpace(loc.Code)
	if loc.Name == "" || loc.Code == "" {
		return errors.New("name and code are required")
	}
	if err := validateLocationImage(loc.ImageURL); err != nil {
		return err
	}
	return s.repo.Create(loc)
}

func (s *locationService) UpdateLocation(id uint, updated *models.Location) (*models.Location, error) {
	if err := validateLocationImage(updated.ImageURL); err != nil {
		return nil, err
	}
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
	existing.Building = updated.Building
	existing.MapKey = updated.MapKey
	existing.ImageURL = updated.ImageURL
	existing.IsActive = updated.IsActive

	if err := s.repo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func validateLocationImage(src string) error {
	if len(src) > 700000 {
		return errors.New("location image must be smaller than 500 KB")
	}
	if src != "" && !strings.HasPrefix(src, "data:image/jpeg;base64,") && !strings.HasPrefix(src, "data:image/png;base64,") && !strings.HasPrefix(src, "data:image/webp;base64,") {
		return errors.New("invalid location image format")
	}
	return nil
}

func (s *locationService) DeleteLocation(id uint) error {
	return s.repo.Delete(id)
}
