package category

import (
	"errors"

	"unifind-dntu/internal/models"
)

type CategoryService interface {
	GetAllCategories() ([]models.Category, error)
	GetCategoryByID(id uint) (*models.Category, error)
	CreateCategory(cat *models.Category) error
	UpdateCategory(id uint, updated *models.Category) (*models.Category, error)
	DeleteCategory(id uint) error
}

type categoryService struct {
	repo CategoryRepository
}

func NewCategoryService(repo CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) GetAllCategories() ([]models.Category, error) {
	return s.repo.FindAll()
}

func (s *categoryService) GetCategoryByID(id uint) (*models.Category, error) {
	return s.repo.FindByID(id)
}

func (s *categoryService) CreateCategory(cat *models.Category) error {
	if cat.Name == "" || cat.Slug == "" {
		return errors.New("name and slug are required")
	}
	return s.repo.Create(cat)
}

func (s *categoryService) UpdateCategory(id uint, updated *models.Category) (*models.Category, error) {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if updated.Name != "" {
		existing.Name = updated.Name
	}
	if updated.Slug != "" {
		existing.Slug = updated.Slug
	}
	if updated.Description != "" {
		existing.Description = updated.Description
	}
	if updated.Icon != "" {
		existing.Icon = updated.Icon
	}
	existing.IsActive = updated.IsActive

	if err := s.repo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *categoryService) DeleteCategory(id uint) error {
	return s.repo.Delete(id)
}
