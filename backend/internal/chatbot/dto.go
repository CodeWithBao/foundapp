package chatbot

type ChatMessageDTO struct {
	Role    string `json:"role"`    // "user" | "bot" | "assistant"
	Content string `json:"content"` // Text content
}

type ChatRequestDTO struct {
	Message    string           `json:"message" binding:"required"`
	History    []ChatMessageDTO `json:"history"`
	ClientTime string           `json:"client_time,omitempty"`
}

type ActionButtonDTO struct {
	Label string `json:"label"`
	Path  string `json:"path,omitempty"`
	Tab   string `json:"tab,omitempty"`
}

type ChatResponseDTO struct {
	Reply         string            `json:"reply"`
	IsGuardrail   bool              `json:"is_guardrail"`
	ActionButtons []ActionButtonDTO `json:"action_buttons,omitempty"`
}
