package item

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/observer"
	"unifind-dntu/internal/patterns/strategy"

	"gorm.io/gorm"
)

const maxItemImages = 8

func validateImageURLs(images []string) error {
	if len(images) > maxItemImages {
		return fmt.Errorf("mỗi bài đăng chỉ được có tối đa %d ảnh", maxItemImages)
	}
	for _, imageURL := range images {
		trimmed := strings.TrimSpace(imageURL)
		if trimmed == "" || len(trimmed) > 2048 || strings.HasPrefix(strings.ToLower(trimmed), "data:") {
			return fmt.Errorf("đường dẫn ảnh không hợp lệ")
		}
	}
	return nil
}

type ItemService interface {
	CreateItem(userID uint, dto CreateItemDTO) (*models.Item, error)
	GetItemByID(id uint, incrementView bool) (*models.Item, error)
	GetItemByClientRequestID(userID uint, clientRequestID string) (*models.Item, error)
	GetItemContact(id uint) (*ItemContactDTO, error)
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
	return &itemService{repo: repo, notifier: notifier}
}

func (s *itemService) CreateItem(userID uint, dto CreateItemDTO) (*models.Item, error) {
	if err := validateImageURLs(dto.Images); err != nil {
		return nil, err
	}
	clientRequestID := strings.TrimSpace(dto.ClientRequestID)
	if len(clientRequestID) > 64 {
		return nil, fmt.Errorf("mã yêu cầu tạo bài không hợp lệ")
	}
	if clientRequestID != "" {
		existing, err := s.repo.FindByUserAndClientRequestID(userID, clientRequestID)
		if err == nil {
			return existing, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}
	status := models.ItemStatusLost
	if dto.Type == models.ItemTypeFound {
		status = models.ItemStatusFound
	}

	item := models.Item{
		ClientRequestID: nil,
		Title:           dto.Title, Type: dto.Type, CategoryID: dto.CategoryID, LocationID: dto.LocationID,
		Date: dto.Date, Time: dto.Time, Description: dto.Description, Color: dto.Color, Brand: dto.Brand,
		DistinctFeatures: dto.DistinctFeatures, ImageFingerprint: dto.ImageFingerprint,
		CurrentStorageLocation: dto.CurrentStorageLocation, CustodyStatus: dto.CustodyStatus,
		Status: status, UserID: userID,
	}
	if clientRequestID != "" {
		item.ClientRequestID = &clientRequestID
	}
	for i, imageURL := range dto.Images {
		item.Images = append(item.Images, models.ItemImage{ImageURL: strings.TrimSpace(imageURL), IsPrimary: i == 0, SortOrder: i})
	}
	if err := s.repo.Create(&item); err != nil {
		if clientRequestID != "" {
			existing, findErr := s.repo.FindByUserAndClientRequestID(userID, clientRequestID)
			if findErr == nil {
				return existing, nil
			}
		}
		return nil, err
	}
	go s.runMatching(&item)
	return s.repo.FindByID(item.ID)
}

func (s *itemService) runMatching(newItem *models.Item) {
	if newItem == nil || (newItem.Status != models.ItemStatusLost && newItem.Status != models.ItemStatusFound) {
		return
	}
	candidates, err := s.repo.FindOppositeTypeItems(newItem.Type)
	if err != nil || len(candidates) == 0 {
		return
	}

	matcher := &strategy.CategoryLocationMatchingStrategy{}
	for i := range candidates {
		candidate := &candidates[i]
		var lostItem, foundItem *models.Item
		if newItem.Type == models.ItemTypeLost {
			lostItem, foundItem = newItem, candidate
		} else {
			lostItem, foundItem = candidate, newItem
		}
		explanation := matcher.Explain(lostItem, foundItem)
		if explanation.Score < 35 {
			continue
		}

		matchRecord := models.Match{LostItemID: lostItem.ID, FoundItemID: foundItem.ID, Score: explanation.Score, MatchedAt: time.Now()}
		created, saveErr := s.repo.SaveMatch(&matchRecord)
		if saveErr != nil || !created || s.notifier == nil {
			continue
		}

		s.notifier.Notify(observer.Event{
			Type: observer.EventItemMatched, UserID: lostItem.UserID,
			Title:     "Cú DNTU tìm thấy món đồ nghi vấn trùng khớp!",
			Message:   fmt.Sprintf("'%s' giống %.0f%% với '%s'. Bấm xem danh sách để kiểm tra ảnh, nội dung và vị trí.", lostItem.Title, explanation.Score, foundItem.Title),
			RelatedID: foundItem.ID,
		})
	}
}

func (s *itemService) GetItemByID(id uint, incrementView bool) (*models.Item, error) {
	if incrementView {
		_ = s.repo.IncrementViews(id)
	}
	return s.repo.FindByID(id)
}

func (s *itemService) GetItemByClientRequestID(userID uint, clientRequestID string) (*models.Item, error) {
	clientRequestID = strings.TrimSpace(clientRequestID)
	if clientRequestID == "" || len(clientRequestID) > 64 {
		return nil, gorm.ErrRecordNotFound
	}
	return s.repo.FindByUserAndClientRequestID(userID, clientRequestID)
}

func (s *itemService) GetItemContact(id uint) (*ItemContactDTO, error) {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	phone := strings.TrimSpace(item.User.Phone)
	email := strings.TrimSpace(item.User.Email)
	if phone == "" && email == "" {
		return nil, fmt.Errorf("người đăng chưa cung cấp thông tin liên hệ")
	}
	return &ItemContactDTO{Phone: phone, Email: email}, nil
}
func (s *itemService) GetAllItems(filter ItemFilterDTO) ([]models.Item, int64, error) {
	return s.repo.FindAll(filter)
}
func (s *itemService) GetUserItems(userID uint) ([]models.Item, error) {
	return s.repo.FindByUserID(userID)
}

func (s *itemService) UpdateItem(id, userID uint, userRole models.Role, dto UpdateItemDTO) (*models.Item, error) {
	if err := validateImageURLs(dto.Images); err != nil {
		return nil, err
	}
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
	if dto.ImageFingerprint != "" {
		item.ImageFingerprint = dto.ImageFingerprint
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
		item.Images = nil
		for i, imageURL := range dto.Images {
			item.Images = append(item.Images, models.ItemImage{ItemID: item.ID, ImageURL: strings.TrimSpace(imageURL), IsPrimary: i == 0, SortOrder: i})
		}
	}
	if err := s.repo.Update(item); err != nil {
		return nil, err
	}
	go s.runMatching(item)
	return s.repo.FindByID(item.ID)
}

func (s *itemService) DeleteItem(id, userID uint, userRole models.Role) error {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if item.UserID != userID && userRole != models.RoleStaff && userRole != models.RoleAdmin {
		return fmt.Errorf("permission denied to delete this item")
	}
	return s.repo.Delete(id)
}
