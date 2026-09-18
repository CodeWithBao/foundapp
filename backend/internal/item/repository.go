package item

import (
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
	SaveMatch(match *models.Match) error
}

type itemRepository struct {
	db *gorm.DB
}

func NewItemRepository(db *gorm.DB) ItemRepository {
	return &itemRepository{db: db}
}

func (r *itemRepository) Create(item *models.Item) error {
	return r.db.Create(item).Error
}

func (r *itemRepository) FindByID(id uint) (*models.Item, error) {
	var item models.Item
	err := r.db.Preload("Category").
		Preload("Location").
		Preload("User").
		Preload("Images").
		First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *itemRepository) FindAll(filter ItemFilterDTO) ([]models.Item, int64, error) {
	var items []models.Item
	var total int64

	query := r.db.Model(&models.Item{}).
		Where("is_hidden = ?", false).
		Preload("Category").
		Preload("Location").
		Preload("User").
		Preload("Images")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}
	if filter.CategoryID > 0 {
		query = query.Where("category_id = ?", filter.CategoryID)
	}
	if filter.LocationID > 0 {
		query = query.Where("location_id = ?", filter.LocationID)
	}
	if filter.UserID > 0 {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("title LIKE ? OR description LIKE ? OR brand LIKE ? OR color LIKE ?", searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page <= 0 {
		page = 1
	}
	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&items).Error
	return items, total, err
}

func (r *itemRepository) FindByUserID(userID uint) ([]models.Item, error) {
	var items []models.Item
	err := r.db.Preload("Category").
		Preload("Location").
		Preload("User").
		Preload("Images").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&items).Error
	return items, err
}

func (r *itemRepository) Update(item *models.Item) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(item).Error; err != nil {
			return err
		}
		if len(item.Images) > 0 {
			if err := tx.Where("item_id = ?", item.ID).Delete(&models.ItemImage{}).Error; err != nil {
				return err
			}
			for i := range item.Images {
				item.Images[i].ItemID = item.ID
			}
			if err := tx.Create(&item.Images).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *itemRepository) Delete(id uint) error {
	return r.db.Delete(&models.Item{}, id).Error
}

func (r *itemRepository) IncrementViews(id uint) error {
	return r.db.Model(&models.Item{}).Where("id = ?", id).UpdateColumn("views", gorm.Expr("views + ?", 1)).Error
}

func (r *itemRepository) FindOppositeTypeItems(itemType models.ItemType) ([]models.Item, error) {
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
		Where("type = ? AND is_locked = ?", targetType, false).
		Find(&items).Error
	return items, err
}

func (r *itemRepository) SaveMatch(match *models.Match) error {
	return r.db.Create(match).Error
}
