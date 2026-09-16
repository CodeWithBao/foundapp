package item

import (
	"fmt"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/observer"
	"unifind-dntu/internal/patterns/strategy"
)

type ItemService interface {
	CreateItem(userID uint, dto CreateItemDTO) (*models.Item, error)
	GetItemByID(id uint, incrementView bool) (*models.Item, error)
	GetAllItems(filter ItemFilterDTO) ([]models.Item, int64, error)
	GetUserItems(userID uint) ([]models.Item, error)
	UpdateItem(id uint, userID uint, userRole models.Role, dto UpdateItemDTO) (*models.Item, error)
	DeleteItem(id uint, userID uint, userRole models.Role) error
}

type itemService struct {
	repo     ItemRepository
	notifier *observer.Subject
}

func NewItemService(repo ItemRepository, notifier *observer.Subject) ItemService {
	return &itemService{
		repo:     repo,
		notifier: notifier,
	}
}

func (s *itemService) CreateItem(userID uint, dto CreateItemDTO) (*models.Item, error) {
	status := models.ItemStatusLost
	if dto.Type == models.ItemTypeFound {
		status = models.ItemStatusFound
	}

	item := models.Item{
		Title:                  dto.Title,
		Type:                   dto.Type,
		CategoryID:             dto.CategoryID,
		LocationID:             dto.LocationID,
		Date:                   dto.Date,
		Time:                   dto.Time,
		Description:            dto.Description,
		Color:                  dto.Color,
		Brand:                  dto.Brand,
		DistinctFeatures:       dto.DistinctFeatures,
		CurrentStorageLocation: dto.CurrentStorageLocation,
		CustodyStatus:          dto.CustodyStatus,
		Status:                 status,
		UserID:                 userID,
	}

	for i, imgURL := range dto.Images {
		item.Images = append(item.Images, models.ItemImage{
			ImageURL:  imgURL,
			IsPrimary: i == 0,
		})
	}

	if err := s.repo.Create(&item); err != nil {
		return nil, err
	}

	go s.runMatching(&item)

	return s.repo.FindByID(item.ID)
}

func (s *itemService) runMatching(newItem *models.Item) {
	candidates, err := s.repo.FindOppositeTypeItems(newItem.Type)
	if err != nil || len(candidates) == 0 {
		return
	}

	matchingCtx := strategy.NewMatchingContext(&strategy.CategoryLocationMatchingStrategy{})

	for _, cand := range candidates {
		var lostItem, foundItem *models.Item
		if newItem.Type == models.ItemTypeLost {
			lostItem = newItem
			foundItem = &cand
		} else {
			lostItem = &cand
			foundItem = newItem
		}

		score := matchingCtx.Match(lostItem, foundItem)
		if score >= 40.0 {
			matchRecord := models.Match{
				LostItemID:  lostItem.ID,
				FoundItemID: foundItem.ID,
				Score:       score,
				MatchedAt:   time.Now(),
			}
			_ = s.repo.SaveMatch(&matchRecord)

			if s.notifier != nil {
				s.notifier.Notify(observer.Event{
					Type:      observer.EventItemMatched,
					UserID:    lostItem.UserID,
					Title:     "Tìm thấy món đồ nghi vấn trùng khớp!",
					Message:   fmt.Sprintf("Món đồ '%s' của bạn có độ trùng khớp %.0f%% với một bài đăng mới: '%s'", lostItem.Title, score, foundItem.Title),
					RelatedID: foundItem.ID,
				})
			}
		}
	}
}

func (s *itemService) GetItemByID(id uint, incrementView bool) (*models.Item, error) {
	if incrementView {
		_ = s.repo.IncrementViews(id)
	}
	return s.repo.FindByID(id)
}

func (s *itemService) GetAllItems(filter ItemFilterDTO) ([]models.Item, int64, error) {
	return s.repo.FindAll(filter)
}

func (s *itemService) GetUserItems(userID uint) ([]models.Item, error) {
	return s.repo.FindByUserID(userID)
}

func (s *itemService) UpdateItem(id uint, userID uint, userRole models.Role, dto UpdateItemDTO) (*models.Item, error) {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if item.UserID != userID && userRole != models.RoleStaff && userRole != models.RoleAdmin {
		return nil, fmt.Errorf("permission denied to edit this item")
	}

	if dto.Title != "" {
		item.Title = dto.Title
	}
	if dto.CategoryID > 0 {
		item.CategoryID = dto.CategoryID
	}
	if dto.LocationID > 0 {
		item.LocationID = dto.LocationID
	}
	if dto.Date != "" {
		item.Date = dto.Date
	}
	if dto.Time != "" {
		item.Time = dto.Time
	}
	if dto.Description != "" {
		item.Description = dto.Description
	}
	if dto.Color != "" {
		item.Color = dto.Color
	}
	if dto.Brand != "" {
		item.Brand = dto.Brand
	}
	if dto.DistinctFeatures != "" {
		item.DistinctFeatures = dto.DistinctFeatures
	}
	if dto.CurrentStorageLocation != "" {
		item.CurrentStorageLocation = dto.CurrentStorageLocation
	}
	if dto.CustodyStatus != "" {
		item.CustodyStatus = dto.CustodyStatus
	}
	if dto.Status != "" {
		item.Status = dto.Status
	}

	if len(dto.Images) > 0 {
		var newImages []models.ItemImage
		for i, imgURL := range dto.Images {
			newImages = append(newImages, models.ItemImage{
				ItemID:    item.ID,
				ImageURL:  imgURL,
				IsPrimary: i == 0,
			})
		}
		item.Images = newImages
	}

	if err := s.repo.Update(item); err != nil {
		return nil, err
	}

	return s.repo.FindByID(item.ID)
}

func (s *itemService) DeleteItem(id uint, userID uint, userRole models.Role) error {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	if item.UserID != userID && userRole != models.RoleStaff && userRole != models.RoleAdmin {
		return fmt.Errorf("permission denied to delete this item")
	}

	return s.repo.Delete(id)
}
