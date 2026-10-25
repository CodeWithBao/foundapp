package auth

import (
	"errors"
	"testing"

	"unifind-dntu/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type mockUserRepo struct {
	users map[string]*models.User
	byID  map[uint]*models.User
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users: make(map[string]*models.User),
		byID:  make(map[uint]*models.User),
	}
}

func (m *mockUserRepo) Create(user *models.User) error {
	if _, exists := m.users[user.Email]; exists {
		return errors.New("Email already registered")
	}
	user.ID = uint(len(m.users) + 1)
	m.users[user.Email] = user
	m.byID[user.ID] = user
	return nil
}

func (m *mockUserRepo) FindByEmail(email string) (*models.User, error) {
	u, ok := m.users[email]
	if !ok {
		return nil, errors.New("User not found")
	}
	return u, nil
}

func (m *mockUserRepo) FindByGoogleSub(googleSub string) (*models.User, error) {
	for _, u := range m.users {
		if u.GoogleSub != nil && *u.GoogleSub == googleSub {
			return u, nil
		}
	}
	return nil, errors.New("User not found")
}

func (m *mockUserRepo) FindByID(id uint) (*models.User, error) {
	u, ok := m.byID[id]
	if !ok {
		return nil, errors.New("User not found")
	}
	return u, nil
}

func (m *mockUserRepo) Update(user *models.User) error {
	m.users[user.Email] = user
	m.byID[user.ID] = user
	return nil
}

func TestAuthService_Register_Success(t *testing.T) {
	repo := newMockUserRepo()
	service := NewAuthService(repo)

	dto := RegisterDTO{
		Name:      "Nguyen Van A",
		Email:     "nva@dntu.edu.vn",
		Password:  "password123",
		StudentID: "DNTU-001",
	}

	res, err := service.Register(dto)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if res.User.Email != dto.Email {
		t.Errorf("Expected email %s, got %s", dto.Email, res.User.Email)
	}
	if res.Token == "" {
		t.Errorf("Expected non-empty JWT token")
	}
}

func TestAuthService_Register_DuplicateEmail(t *testing.T) {
	repo := newMockUserRepo()
	service := NewAuthService(repo)

	dto := RegisterDTO{
		Name:     "Test User",
		Email:    "dup@dntu.edu.vn",
		Password: "password123",
	}

	_, _ = service.Register(dto)
	_, err := service.Register(dto)
	if err == nil {
		t.Fatalf("Expected duplicate email error, got nil")
	}
}

func TestAuthService_Login_Success(t *testing.T) {
	repo := newMockUserRepo()
	service := NewAuthService(repo)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	repo.Create(&models.User{
		Name:         "User Active",
		Email:        "active@dntu.edu.vn",
		PasswordHash: string(hashedPassword),
		Role:         models.RoleUser,
		Status:       "ACTIVE",
	})

	res, err := service.Login(LoginDTO{
		Email:    "active@dntu.edu.vn",
		Password: "secret123",
	})
	if err != nil {
		t.Fatalf("Expected login success, got error %v", err)
	}
	if res.Token == "" {
		t.Errorf("Expected valid token")
	}
}

func TestAuthService_Login_InvalidPassword(t *testing.T) {
	repo := newMockUserRepo()
	service := NewAuthService(repo)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	repo.Create(&models.User{
		Name:         "User Active",
		Email:        "active@dntu.edu.vn",
		PasswordHash: string(hashedPassword),
		Role:         models.RoleUser,
		Status:       "ACTIVE",
	})

	_, err := service.Login(LoginDTO{
		Email:    "active@dntu.edu.vn",
		Password: "wrongpassword",
	})
	if err == nil {
		t.Fatalf("Expected error for wrong password, got nil")
	}
}

func TestAuthService_Login_UserNotFound(t *testing.T) {
	repo := newMockUserRepo()
	service := NewAuthService(repo)

	_, err := service.Login(LoginDTO{
		Email:    "notexist@dntu.edu.vn",
		Password: "password123",
	})
	if err == nil {
		t.Fatalf("Expected error for non-existent user, got nil")
	}
}

func TestAuthService_Login_BannedUser(t *testing.T) {
	repo := newMockUserRepo()
	service := NewAuthService(repo)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	repo.Create(&models.User{
		Name:         "User Banned",
		Email:        "banned@dntu.edu.vn",
		PasswordHash: string(hashedPassword),
		Role:         models.RoleUser,
		Status:       "BANNED",
	})

	_, err := service.Login(LoginDTO{
		Email:    "banned@dntu.edu.vn",
		Password: "secret123",
	})
	if err == nil {
		t.Fatalf("Expected banned account error, got nil")
	}
}
