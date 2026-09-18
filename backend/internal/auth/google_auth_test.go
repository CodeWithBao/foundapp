package auth_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"unifind-dntu/internal/auth"
	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/googleauth"

	"github.com/gin-gonic/gin"
)

// MockUserRepository implements auth.UserRepository in memory
type MockUserRepository struct {
	usersByEmail map[string]*models.User
	usersBySub   map[string]*models.User
	usersByID    map[uint]*models.User
	lastID       uint
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		usersByEmail: make(map[string]*models.User),
		usersBySub:   make(map[string]*models.User),
		usersByID:    make(map[uint]*models.User),
	}
}

func (m *MockUserRepository) Create(user *models.User) error {
	m.lastID++
	user.ID = m.lastID
	m.usersByID[user.ID] = user
	m.usersByEmail[user.Email] = user
	if user.GoogleSub != nil {
		m.usersBySub[*user.GoogleSub] = user
	}
	return nil
}

func (m *MockUserRepository) FindByEmail(email string) (*models.User, error) {
	if u, ok := m.usersByEmail[email]; ok {
		return u, nil
	}
	return nil, errors.New("user not found")
}

func (m *MockUserRepository) FindByGoogleSub(sub string) (*models.User, error) {
	if u, ok := m.usersBySub[sub]; ok {
		return u, nil
	}
	return nil, errors.New("user not found")
}

func (m *MockUserRepository) FindByID(id uint) (*models.User, error) {
	if u, ok := m.usersByID[id]; ok {
		return u, nil
	}
	return nil, errors.New("user not found")
}

func (m *MockUserRepository) Update(user *models.User) error {
	m.usersByID[user.ID] = user
	m.usersByEmail[user.Email] = user
	if user.GoogleSub != nil {
		m.usersBySub[*user.GoogleSub] = user
	}
	return nil
}

// MockGoogleVerifier implements googleauth.TokenVerifier
type MockGoogleVerifier struct {
	PayloadFunc func(ctx context.Context, tokenString string, clientID string) (*googleauth.GoogleTokenPayload, error)
}

func (v *MockGoogleVerifier) VerifyToken(ctx context.Context, tokenString string, clientID string) (*googleauth.GoogleTokenPayload, error) {
	if v.PayloadFunc != nil {
		return v.PayloadFunc(ctx, tokenString, clientID)
	}
	return nil, errors.New("invalid or expired Google token")
}

func setupTestApp(repo auth.UserRepository, verifier googleauth.TokenVerifier) (*gin.Engine, auth.AuthService) {
	gin.SetMode(gin.TestMode)
	svc := auth.NewAuthServiceWithVerifier(repo, verifier)
	h := auth.NewAuthHandler(svc)

	r := gin.New()
	r.POST("/api/v1/auth/google", h.GoogleLogin)
	return r, svc
}

// 1. TestGoogleAuth_PersonalGmail_Success
func TestGoogleAuth_PersonalGmail_Success(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           "sub-gmail-123456",
				Email:         "user@gmail.com",
				Name:          "Personal Gmail User",
				EmailVerified: true,
			}, nil
		},
	}
	_, svc := setupTestApp(repo, verifier)
	res, err := svc.GoogleLogin(context.Background(), "valid_gmail_token")
	if err != nil {
		t.Fatalf("Expected success for personal gmail, got error: %v", err)
	}
	if res.User.Email != "user@gmail.com" || res.User.Role != models.RoleUser || res.User.AuthProvider != "GOOGLE" || res.User.Status != "ACTIVE" {
		t.Errorf("User details mismatch: %+v", res.User)
	}
	if res.Token == "" {
		t.Errorf("Expected valid JWT token")
	}
}

// 2. TestGoogleAuth_WorkspaceOtherDomain_Success
func TestGoogleAuth_WorkspaceOtherDomain_Success(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           "sub-workspace-789",
				Email:         "director@techcorp.vn",
				Name:          "Workspace User",
				EmailVerified: true,
			}, nil
		},
	}
	_, svc := setupTestApp(repo, verifier)
	res, err := svc.GoogleLogin(context.Background(), "valid_workspace_token")
	if err != nil {
		t.Fatalf("Expected success for custom domain workspace, got error: %v", err)
	}
	if res.User.Email != "director@techcorp.vn" || res.User.Role != models.RoleUser {
		t.Errorf("Unexpected user: %+v", res.User)
	}
}

// 3. TestGoogleAuth_DNTUEmail_Success
func TestGoogleAuth_DNTUEmail_Success(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           "sub-dntu-111",
				Email:         "student@dntu.edu.vn",
				Name:          "DNTU Student",
				EmailVerified: true,
			}, nil
		},
	}
	_, svc := setupTestApp(repo, verifier)
	res, err := svc.GoogleLogin(context.Background(), "valid_dntu_token")
	if err != nil {
		t.Fatalf("Expected success for DNTU domain, got error: %v", err)
	}
	if res.User.Email != "student@dntu.edu.vn" || res.User.Role != models.RoleUser {
		t.Errorf("Unexpected user: %+v", res.User)
	}
}

// 4. TestGoogleAuth_ExistingGoogleAccount_Login
func TestGoogleAuth_ExistingGoogleAccount_Login(t *testing.T) {
	repo := NewMockUserRepository()
	sub := "sub-existing-444"
	existing := &models.User{
		Name:         "Old Google User",
		Email:        "existing@gmail.com",
		GoogleSub:    &sub,
		AuthProvider: "GOOGLE",
		Role:         models.RoleUser,
		Status:       "ACTIVE",
	}
	_ = repo.Create(existing)

	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           sub,
				Email:         "existing@gmail.com",
				EmailVerified: true,
			}, nil
		},
	}
	_, svc := setupTestApp(repo, verifier)
	res, err := svc.GoogleLogin(context.Background(), "existing_token")
	if err != nil {
		t.Fatalf("Expected successful login for existing Google account, got: %v", err)
	}
	if res.User.ID != existing.ID {
		t.Errorf("Expected user ID %d, got %d", existing.ID, res.User.ID)
	}
}

// 5. TestGoogleAuth_LocalEmailConflict_Returns409
func TestGoogleAuth_LocalEmailConflict_Returns409(t *testing.T) {
	repo := NewMockUserRepository()
	localUser := &models.User{
		Name:         "Local Account Holder",
		Email:        "conflict@gmail.com",
		PasswordHash: "$2a$10$hashedpasswordxyz",
		GoogleSub:    nil,
		AuthProvider: "LOCAL",
		Role:         models.RoleUser,
		Status:       "ACTIVE",
	}
	_ = repo.Create(localUser)

	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           "new-sub-trying-to-take-over",
				Email:         "conflict@gmail.com",
				EmailVerified: true,
			}, nil
		},
	}
	router, _ := setupTestApp(repo, verifier)

	body, _ := json.Marshal(map[string]string{"credential": "mock_token"})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("Expected HTTP 409 Conflict, got %d: %s", w.Code, w.Body.String())
	}

	var jsonResp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &jsonResp)
	if jsonResp["error"] != "ACCOUNT_ALREADY_EXISTS" {
		t.Errorf("Expected error code ACCOUNT_ALREADY_EXISTS, got: %v", jsonResp["error"])
	}
}

// 6. TestGoogleAuth_BannedAccount_Blocked
func TestGoogleAuth_BannedAccount_Blocked(t *testing.T) {
	repo := NewMockUserRepository()
	sub := "sub-banned-666"
	bannedUser := &models.User{
		Name:         "Banned User",
		Email:        "banned@gmail.com",
		GoogleSub:    &sub,
		AuthProvider: "GOOGLE",
		Role:         models.RoleUser,
		Status:       "BANNED",
	}
	_ = repo.Create(bannedUser)

	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           sub,
				Email:         "banned@gmail.com",
				EmailVerified: true,
			}, nil
		},
	}
	_, svc := setupTestApp(repo, verifier)
	_, err := svc.GoogleLogin(context.Background(), "banned_token")
	if err == nil {
		t.Fatalf("Expected error for BANNED user, got nil")
	}
}

// 7. TestGoogleAuth_InactiveAccount_Blocked
func TestGoogleAuth_InactiveAccount_Blocked(t *testing.T) {
	repo := NewMockUserRepository()
	sub := "sub-inactive-777"
	inactiveUser := &models.User{
		Name:         "Inactive User",
		Email:        "inactive@gmail.com",
		GoogleSub:    &sub,
		AuthProvider: "GOOGLE",
		Role:         models.RoleUser,
		Status:       "INACTIVE",
	}
	_ = repo.Create(inactiveUser)

	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           sub,
				Email:         "inactive@gmail.com",
				EmailVerified: true,
			}, nil
		},
	}
	_, svc := setupTestApp(repo, verifier)
	_, err := svc.GoogleLogin(context.Background(), "inactive_token")
	if err == nil {
		t.Fatalf("Expected error for INACTIVE user, got nil")
	}
}

// 8. TestGoogleAuth_InvalidToken_Returns401
func TestGoogleAuth_InvalidToken_Returns401(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return nil, errors.New("invalid or expired Google token")
		},
	}
	router, _ := setupTestApp(repo, verifier)

	body, _ := json.Marshal(map[string]string{"credential": "corrupted_token"})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected HTTP 401 Unauthorized for invalid token, got %d: %s", w.Code, w.Body.String())
	}
}

// 9. TestGoogleAuth_UnverifiedEmail_Returns401
func TestGoogleAuth_UnverifiedEmail_Returns401(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return nil, errors.New("email not verified")
		},
	}
	router, _ := setupTestApp(repo, verifier)

	body, _ := json.Marshal(map[string]string{"credential": "unverified_email_token"})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected HTTP 401 Unauthorized for unverified email, got %d: %s", w.Code, w.Body.String())
	}
}

// 10. TestGoogleAuth_AudienceMismatch_Returns401
func TestGoogleAuth_AudienceMismatch_Returns401(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return nil, errors.New("invalid audience")
		},
	}
	router, _ := setupTestApp(repo, verifier)

	body, _ := json.Marshal(map[string]string{"credential": "wrong_aud_token"})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected HTTP 401 Unauthorized for audience mismatch, got %d: %s", w.Code, w.Body.String())
	}
}

// 11. TestGoogleAuth_DefaultRoleUser_IgnoreAdminRequest
func TestGoogleAuth_DefaultRoleUser_IgnoreAdminRequest(t *testing.T) {
	repo := NewMockUserRepository()
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			return &googleauth.GoogleTokenPayload{
				Sub:           "sub-hacker-attacker",
				Email:         "attacker@gmail.com",
				EmailVerified: true,
			}, nil
		},
	}
	router, _ := setupTestApp(repo, verifier)

	// Frontend tries to inject role ADMIN
	payload := map[string]interface{}{
		"credential": "hacker_token",
		"role":       "ADMIN",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected HTTP 200, got %d", w.Code)
	}

	var res struct {
		Data struct {
			User models.User `json:"user"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &res)
	if res.Data.User.Role != models.RoleUser {
		t.Fatalf("CRITICAL SECURITY: User was granted %s instead of USER", res.Data.User.Role)
	}
}

// 12. TestGoogleAuth_PayloadBinding_BothCredentialAndIdToken
func TestGoogleAuth_PayloadBinding_BothCredentialAndIdToken(t *testing.T) {
	repo := NewMockUserRepository()
	calledWith := ""
	verifier := &MockGoogleVerifier{
		PayloadFunc: func(ctx context.Context, tokenString, clientID string) (*googleauth.GoogleTokenPayload, error) {
			calledWith = tokenString
			return &googleauth.GoogleTokenPayload{
				Sub:           "sub-binding-test-" + tokenString,
				Email:         "binding_" + tokenString + "@gmail.com",
				EmailVerified: true,
			}, nil
		},
	}
	router, _ := setupTestApp(repo, verifier)

	// Test 1: credential field
	body1, _ := json.Marshal(map[string]string{"credential": "token_via_credential_field"})
	req1, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK || calledWith != "token_via_credential_field" {
		t.Fatalf("Failed binding 'credential' field, got status %d, token %s", w1.Code, calledWith)
	}

	// Test 2: id_token field
	body2, _ := json.Marshal(map[string]string{"id_token": "token_via_id_token_field"})
	req2, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(body2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK || calledWith != "token_via_id_token_field" {
		t.Fatalf("Failed binding 'id_token' field, got status %d, token %s", w2.Code, calledWith)
	}
}

func init() {
	_ = os.Setenv("JWT_SECRET", "test_secret_for_google_auth_unit_tests_32char_key")
}
