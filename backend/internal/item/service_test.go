package item

import (
	"testing"
	"time"

	"unifind-dntu/internal/models"

	"gorm.io/gorm"
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
	return nil, gorm.ErrRecordNotFound
}

func (m *mockItemRepo) FindByUserAndClientRequestID(userID uint, clientRequestID string) (*models.Item, error) {
	for _, item := range m.items {
		if item.UserID == userID && item.ClientRequestID != nil && *item.ClientRequestID == clientRequestID {
			return item, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
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

func (m *mockItemRepo) SaveMatch(match *models.Match) (bool, error) {
	return true, nil
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

func TestItemService_UpdateItemRequiresOwnerOrElevatedRole(t *testing.T) {
	repo := newMockItemRepo()
	repo.items[7] = &models.Item{ID: 7, UserID: 1, Title: "Ví đen", Type: models.ItemTypeLost, Status: models.ItemStatusLost}
	service := NewItemService(repo, nil)

	if _, err := service.UpdateItem(7, 2, models.RoleUser, UpdateItemDTO{Title: "Sửa trái phép"}); err == nil {
		t.Fatal("expected a permission error for a non-owner user")
	}

	updated, err := service.UpdateItem(7, 1, models.RoleUser, UpdateItemDTO{Title: "Ví đen đã cập nhật"})
	if err != nil {
		t.Fatalf("expected owner update to succeed, got %v", err)
	}
	if updated.Title != "Ví đen đã cập nhật" {
		t.Fatalf("expected updated title, got %q", updated.Title)
	}
}

func TestItemService_CreateItemIsIdempotentPerUser(t *testing.T) {
	repo := newMockItemRepo()
	service := NewItemService(repo, nil)
	dto := CreateItemDTO{
		ClientRequestID: "request-123",
		Title:           "Ví màu đen",
		Type:            models.ItemTypeLost,
	}

	first, err := service.CreateItem(1, dto)
	if err != nil {
		t.Fatalf("expected first create to succeed, got %v", err)
	}
	second, err := service.CreateItem(1, dto)
	if err != nil {
		t.Fatalf("expected duplicate create to return existing item, got %v", err)
	}
	if first.ID != second.ID || len(repo.items) != 1 {
		t.Fatalf("expected one item for repeated request, got IDs %d and %d with %d records", first.ID, second.ID, len(repo.items))
	}

	third, err := service.CreateItem(2, dto)
	if err != nil {
		t.Fatalf("expected another user to reuse the request id, got %v", err)
	}
	if third.ID == first.ID || len(repo.items) != 2 {
		t.Fatalf("expected request id scope to be per user")
	}
}

func TestItemService_GetItemContactReturnsOnlyContactFields(t *testing.T) {
	repo := newMockItemRepo()
	repo.items[7] = &models.Item{
		ID:     7,
		UserID: 10,
		User: models.User{
			ID:        10,
			Phone:     "0912345678",
			Email:     "student@dntu.edu.vn",
			StudentID: "2080601234",
		},
	}
	service := NewItemService(repo, nil)

	contact, err := service.GetItemContact(7)
	if err != nil {
		t.Fatalf("expected contact retrieval to succeed, got %v", err)
	}
	if contact.Phone != "0912345678" || contact.Email != "student@dntu.edu.vn" {
		t.Fatalf("unexpected contact response: %#v", contact)
	}

	repo.items[8] = &models.Item{ID: 8, UserID: 11}
	if _, err := service.GetItemContact(8); err == nil {
		t.Fatal("expected an error when the owner has no contact information")
	}
}
