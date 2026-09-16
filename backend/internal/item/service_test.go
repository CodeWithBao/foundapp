package item

import (
	"testing"
	"time"

	"unifind-dntu/internal/models"
)

type mockItemRepo struct {
	items map[uint]*models.Item
}

func newMockItemRepo() *mockItemRepo {
	return &mockItemRepo{
		items: make(map[uint]*models.Item),
	}
}

func (m *mockItemRepo) Create(item *models.Item) error {
	item.ID = uint(len(m.items) + 1)
	m.items[item.ID] = item
	return nil
}

func (m *mockItemRepo) FindByID(id uint) (*models.Item, error) {
	if item, ok := m.items[id]; ok {
		return item, nil
	}
	return nil, nil
}

func (m *mockItemRepo) FindAll(filter ItemFilterDTO) ([]models.Item, int64, error) {
	var result []models.Item
	for _, item := range m.items {
		result = append(result, *item)
	}
	return result, int64(len(result)), nil
}

func (m *mockItemRepo) FindByUserID(userID uint) ([]models.Item, error) {
	return nil, nil
}

func (m *mockItemRepo) Update(item *models.Item) error {
	m.items[item.ID] = item
	return nil
}

func (m *mockItemRepo) Delete(id uint) error {
	delete(m.items, id)
	return nil
}

func (m *mockItemRepo) IncrementViews(id uint) error {
	if item, ok := m.items[id]; ok {
		item.Views++
	}
	return nil
}

func (m *mockItemRepo) FindOppositeTypeItems(itemType models.ItemType) ([]models.Item, error) {
	return []models.Item{}, nil
}

func (m *mockItemRepo) SaveMatch(match *models.Match) error {
	return nil
}

func TestItemService_CreateItem_Lost(t *testing.T) {
	repo := newMockItemRepo()
	service := NewItemService(repo, nil)

	dto := CreateItemDTO{
		Title: "Test Lost Item",
		Type:  models.ItemTypeLost,
		Date:  time.Now().Format("2006-01-02"),
	}

	item, err := service.CreateItem(1, dto)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if item.Type != models.ItemTypeLost {
		t.Errorf("Expected Type LOST, got %s", item.Type)
	}
	if item.Status != models.ItemStatusLost {
		t.Errorf("Expected Status LOST, got %s", item.Status)
	}
}

func TestItemService_CreateItem_Found(t *testing.T) {
	repo := newMockItemRepo()
	service := NewItemService(repo, nil)

	dto := CreateItemDTO{
		Title: "Test Found Item",
		Type:  models.ItemTypeFound,
		Date:  time.Now().Format("2006-01-02"),
	}

	item, err := service.CreateItem(1, dto)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if item.Type != models.ItemTypeFound {
		t.Errorf("Expected Type FOUND, got %s", item.Type)
	}
	if item.Status != models.ItemStatusFound {
		t.Errorf("Expected Status FOUND, got %s", item.Status)
	}
}
