package matching

import (
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type MatchingRepository interface {
	GetUserItems(userID uint) ([]models.Item, error)
	GetItemByID(itemID uint) (*models.Item, error)
	GetOppositeItems(itemType models.ItemType) ([]models.Item, error)
	GetSavedMatches(itemID uint) ([]models.Match, error)
	GetSavedMatchesForUser(userID uint) ([]models.Match, error)
}

type matchingRepository struct {
	db *gorm.DB
}

func NewMatchingRepository(db *gorm.DB) MatchingRepository {
	return &matchingRepository{db: db}
}

func (r *matchingRepository) GetUserItems(userID uint) ([]models.Item, error) {
	var items []models.Item
	err := r.db.Preload("Category").
		Preload("Location").
		Preload("User").
		Preload("Images").
		Where("user_id = ? AND is_locked = ?", userID, false).
		Find(&items).Error
	return items, err
}

func (r *matchingRepository) GetItemByID(itemID uint) (*models.Item, error) {
	var item models.Item
	err := r.db.Preload("Category").
		Preload("Location").
		Preload("User").
		Preload("Images").
		First(&item, itemID).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *matchingRepository) GetOppositeItems(itemType models.ItemType) ([]models.Item, error) {
	var targetType models.ItemType
	if itemType == models.ItemTypeLost {
		targetType = models.ItemTypeFound
	} else {
		targetType = models.ItemTypeLost
	}

	var items []models.Item
	err := r.db.Preload("Category").
		Preload("Location").
		Preload("User").
		Preload("Images").
		Where("type = ? AND is_locked = ?", targetType, false).
		Find(&items).Error
	return items, err
}

func (r *matchingRepository) GetSavedMatches(itemID uint) ([]models.Match, error) {
	var matches []models.Match
	err := r.db.Preload("LostItem.Category").Preload("LostItem.Location").Preload("LostItem.Images").
		Preload("FoundItem.Category").Preload("FoundItem.Location").Preload("FoundItem.Images").
		Where("lost_item_id = ? OR found_item_id = ?", itemID, itemID).
		Order("score desc").
		Find(&matches).Error
	return matches, err
}

func (r *matchingRepository) GetSavedMatchesForUser(userID uint) ([]models.Match, error) {
	var userItemIDs []uint
	r.db.Model(&models.Item{}).Where("user_id = ?", userID).Pluck("id", &userItemIDs)

	if len(userItemIDs) == 0 {
		return nil, nil
	}

	var matches []models.Match
	err := r.db.Preload("LostItem.Category").Preload("LostItem.Location").Preload("LostItem.Images").
		Preload("FoundItem.Category").Preload("FoundItem.Location").Preload("FoundItem.Images").
		Where("lost_item_id IN ? OR found_item_id IN ?", userItemIDs, userItemIDs).
		Order("score desc").
		Find(&matches).Error
	return matches, err
}
