package observer

import (
	"testing"
)

type mockTestObserver struct {
	eventsReceived []Event
}

func (m *mockTestObserver) OnNotify(event Event) {
	m.eventsReceived = append(m.eventsReceived, event)
}

func TestObserverPattern_RegisterAndNotify(t *testing.T) {
	subject := &Subject{}
	obs1 := &mockTestObserver{}
	obs2 := &mockTestObserver{}

	subject.Register(obs1)
	subject.Register(obs2)

	testEvent := Event{
		Type:      EventClaimCreated,
		UserID:    10,
		Title:     "Test Event",
		Message:   "Observer pattern notification test",
		RelatedID: 99,
	}

	subject.Notify(testEvent)

	if len(obs1.eventsReceived) != 1 {
		t.Fatalf("Expected obs1 to receive 1 event, got %d", len(obs1.eventsReceived))
	}
	if len(obs2.eventsReceived) != 1 {
		t.Fatalf("Expected obs2 to receive 1 event, got %d", len(obs2.eventsReceived))
	}

	if obs1.eventsReceived[0].Title != "Test Event" {
		t.Errorf("Expected title 'Test Event', got %s", obs1.eventsReceived[0].Title)
	}
}
