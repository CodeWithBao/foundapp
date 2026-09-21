package item

import (
	"errors"
	"unifind-dntu/internal/models"

	"gorm.io/gorm"
)

type ItemRepository interface {
	Create(item *models.Item) error
	FindByID(id uint) (*models.Item, error)
	FindAll(filter ItemFilterDTO) ([]models.Item, int64, error)
	FindByUserID(userID uint) ([]models.Item, error)
	Update(item *models.Item) error
	Delete(id uint) error
	IncrementViews(id uint) error
	FindOppositeTypeItems(itemType models.ItemType) ([]models.Item, error)
	SaveMatch(match *models.Match) (bool, error)
}

type itemRepository struct{ db *gorm.DB }
func NewItemRepository(db *gorm.DB) ItemRepository { return &itemRepository{db: db} }
func (r *itemRepository) Create(item *models.Item) error { return r.db.Create(item).Error }

func preloadItem(query *gorm.DB) *gorm.DB {
	return query.Preload("Category").Preload("Location").Preload("User").Preload("Images")
}

func (r *itemRepository) FindByID(id uint) (*models.Item, error) {
	var item models.Item
	if err := preloadItem(r.db).First(&item, id).Error; err != nil { return nil, err }
	return &item, nil
}

func (r *itemRepository) FindAll(filter ItemFilterDTO) ([]models.Item, int64, error) {
	var items []models.Item
	var total int64
	query := preloadItem(r.db.Model(&models.Item{}).Where("is_hidden = ?", false))
	if filter.Status != "" { query = query.Where("status = ?", filter.Status) }
	if filter.Type != "" { query = query.Where("type = ?", filter.Type) }
	if filter.CategoryID > 0 { query = query.Where("category_id = ?", filter.CategoryID) }
	if filter.LocationID > 0 { query = query.Where("location_id = ?", filter.LocationID) }
	if filter.UserID > 0 { query = query.Where("user_id = ?", filter.UserID) }
	if filter.Search != "" {
		term := "%" + filter.Search + "%"
		query = query.Where("title LIKE ? OR description LIKE ? OR brand LIKE ? OR color LIKE ? OR distinct_features LIKE ?", term, term, term, term, term)
	}
	if err := query.Count(&total).Error; err != nil { return nil, 0, err }
	page, limit := filter.Page, filter.Limit
	if page <= 0 { page = 1 }
	if limit <= 0 { limit = 20 }
	err := query.Order("created_at desc").Offset((page-1)*limit).Limit(limit).Find(&items).Error
	return items, total, err
}

func (r *itemRepository) FindByUserID(userID uint) ([]models.Item, error) {
	var items []models.Item
	err := preloadItem(r.db).Where("user_id = ?", userID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *itemRepository) Update(item *models.Item) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(item).Error; err != nil { return err }
		if len(item.Images) == 0 { return nil }
		if err := tx.Where("item_id = ?", item.ID).Delete(&models.ItemImage{}).Error; err != nil { return err }
		for i := range item.Images { item.Images[i].ItemID = item.ID }
		return tx.Create(&item.Images).Error
	})
}

func (r *itemRepository) Delete(id uint) error { return r.db.Delete(&models.Item{}, id).Error }
func (r *itemRepository) IncrementViews(id uint) error { return r.db.Model(&models.Item{}).Where("id = ?", id).UpdateColumn("views", gorm.Expr("views + ?", 1)).Error }

func (r *itemRepository) FindOppositeTypeItems(itemType models.ItemType) ([]models.Item, error) {
	targetType, targetStatus := models.ItemTypeLost, models.ItemStatusLost
	if itemType == models.ItemTypeLost { targetType, targetStatus = models.ItemTypeFound, models.ItemStatusFound }
	var items []models.Item
	err := preloadItem(r.db).Where("type = ? AND status = ? AND is_locked = ? AND is_hidden = ?", targetType, targetStatus, false, false).Find(&items).Error
	return items, err
}

func (r *itemRepository) SaveMatch(match *models.Match) (bool, error) {
	var existing models.Match
	err := r.db.Where("lost_item_id = ? AND found_item_id = ?", match.LostItemID, match.FoundItemID).First(&existing).Error
	if err == nil {
		return false, r.db.Model(&existing).Updates(map[string]interface{}{"score": match.Score, "matched_at": match.MatchedAt}).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) { return false, err }
	if err := r.db.Create(match).Error; err != nil { return false, err }
	return true, nil
}
