package googleauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"google.golang.org/api/idtoken"
)

type GoogleTokenPayload struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

type TokenVerifier interface {
	VerifyToken(ctx context.Context, tokenString string, clientID string) (*GoogleTokenPayload, error)
}

type DefaultVerifier struct{}

func NewVerifier() TokenVerifier {
	return &DefaultVerifier{}
}

func (v *DefaultVerifier) VerifyToken(ctx context.Context, tokenString string, clientID string) (*GoogleTokenPayload, error) {
	if tokenString == "" {
		return nil, errors.New("empty token")
	}

	// First try official idtoken package if audience is specified
	if clientID != "" {
		payload, err := idtoken.Validate(ctx, tokenString, clientID)
		if err == nil && payload != nil {
			sub, _ := payload.Claims["sub"].(string)
			email, _ := payload.Claims["email"].(string)
			name, _ := payload.Claims["name"].(string)
			picture, _ := payload.Claims["picture"].(string)

			var emailVerified bool
			if ev, ok := payload.Claims["email_verified"].(bool); ok {
				emailVerified = ev
			} else if evStr, ok := payload.Claims["email_verified"].(string); ok && evStr == "true" {
				emailVerified = true
			}

			if !emailVerified {
				return nil, errors.New("email not verified")
			}

			return &GoogleTokenPayload{
				Sub:           sub,
				Email:         email,
				EmailVerified: emailVerified,
				Name:          name,
				Picture:       picture,
			}, nil
		}
	}

	// Fallback/any_google mode: verify via Google tokeninfo endpoint
	reqURL := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", tokenString)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to verify google token with tokeninfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid or expired Google token")
	}

	var raw map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}

	aud, _ := raw["aud"].(string)
	if clientID != "" && aud != clientID {
		return nil, errors.New("invalid audience")
	}

	sub, _ := raw["sub"].(string)
	email, _ := raw["email"].(string)
	name, _ := raw["name"].(string)
	picture, _ := raw["picture"].(string)

	if sub == "" || email == "" {
		return nil, errors.New("token payload missing required claims (sub, email)")
	}

	emailVerifiedStr, _ := raw["email_verified"].(string)
	var emailVerified bool
	if emailVerifiedStr == "true" {
		emailVerified = true
	} else if evBool, ok := raw["email_verified"].(bool); ok {
		emailVerified = evBool
	}

	if !emailVerified {
		return nil, errors.New("email not verified")
	}

	return &GoogleTokenPayload{
		Sub:           sub,
		Email:         email,
		EmailVerified: emailVerified,
		Name:          name,
		Picture:       picture,
	}, nil
}
