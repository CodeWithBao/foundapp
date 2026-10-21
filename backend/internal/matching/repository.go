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

type matchingRepository struct{ db *gorm.DB }
func NewMatchingRepository(db *gorm.DB) MatchingRepository { return &matchingRepository{db: db} }

func preloadItems(query *gorm.DB) *gorm.DB {
	return query.Preload("Category").Preload("Location").Preload("User").Preload("Images")
}

func (r *matchingRepository) GetUserItems(userID uint) ([]models.Item, error) {
	var items []models.Item
	err := preloadItems(r.db).
		Where("user_id = ? AND type = ? AND status = ? AND is_locked = ? AND is_hidden = ?", userID, models.ItemTypeLost, models.ItemStatusLost, false, false).
		Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *matchingRepository) GetItemByID(itemID uint) (*models.Item, error) {
	var item models.Item
	if err := preloadItems(r.db).First(&item, itemID).Error; err != nil { return nil, err }
	return &item, nil
}

func (r *matchingRepository) GetOppositeItems(itemType models.ItemType) ([]models.Item, error) {
	targetType, targetStatus := models.ItemTypeLost, models.ItemStatusLost
	if itemType == models.ItemTypeLost { targetType, targetStatus = models.ItemTypeFound, models.ItemStatusFound }
	var items []models.Item
	err := preloadItems(r.db).
		Where("type = ? AND status = ? AND is_locked = ? AND is_hidden = ?", targetType, targetStatus, false, false).
		Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *matchingRepository) GetSavedMatches(itemID uint) ([]models.Match, error) {
	var matches []models.Match
	err := r.db.Preload("LostItem.Category").Preload("LostItem.Location").Preload("LostItem.Images").
		Preload("FoundItem.Category").Preload("FoundItem.Location").Preload("FoundItem.Images").
		Where("lost_item_id = ? OR found_item_id = ?", itemID, itemID).Order("score desc").Find(&matches).Error
	return matches, err
}

func (r *matchingRepository) GetSavedMatchesForUser(userID uint) ([]models.Match, error) {
	var lostItemIDs []uint
	if err := r.db.Model(&models.Item{}).Where("user_id = ? AND type = ?", userID, models.ItemTypeLost).Pluck("id", &lostItemIDs).Error; err != nil { return nil, err }
	if len(lostItemIDs) == 0 { return []models.Match{}, nil }
	var matches []models.Match
	err := r.db.Where("lost_item_id IN ?", lostItemIDs).Order("score desc").Find(&matches).Error
	return matches, err
}
