package sms

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"sync"
	"time"

	"github.com/zitadel/logging"

	"github.com/zitadel/zitadel/internal/notification/channels"
	"github.com/zitadel/zitadel/internal/notification/messages"
	"github.com/zitadel/zitadel/internal/zerrors"
)

// MockSMSService хранит коды верификации в памяти для тестирования
type MockSMSService struct {
	codes map[string]*StoredCode // key = phone number
	mu    sync.RWMutex
}

type StoredCode struct {
	Code      string
	ExpiresAt time.Time
	CodeType  CodeType
}

type CodeType string

const (
	CodeTypeRegistration CodeType = "registration"
	CodeTypeLogin        CodeType = "login"
	CodeTypeVerification CodeType = "verification"
)

var (
	// Глобальный экземпляр mock SMS сервиса
	mockSMSService *MockSMSService
	mockSMSOnce    sync.Once
)

// GetMockSMSService возвращает глобальный экземпляр mock SMS сервиса
func GetMockSMSService() *MockSMSService {
	mockSMSOnce.Do(func() {
		mockSMSService = &MockSMSService{
			codes: make(map[string]*StoredCode),
		}
		logging.Info("📱 Mock SMS сервис инициализирован")
	})
	return mockSMSService
}

// InitMockChannel инициализирует mock SMS канал
func InitMockChannel() channels.NotificationChannel {
	mockSvc := GetMockSMSService()
	logging.Debug("successfully initialized mock SMS channel")

	return channels.HandleMessageFunc(func(message channels.Message) error {
		smsMsg, ok := message.(*messages.SMS)
		if !ok {
			return zerrors.ThrowInternal(nil, "MOCKSMS-s0pLc", "message is not SMS")
		}

		// Генерируем 6-значный код
		code, err := generateCode()
		if err != nil {
			return zerrors.ThrowInternal(err, "MOCKSMS-gen01", "could not generate code")
		}

		// Сохраняем код в памяти
		err = mockSvc.StoreCode(context.Background(), smsMsg.RecipientPhoneNumber, code, CodeTypeVerification)
		if err != nil {
			return err
		}

		logging.WithFields(
			"phone", smsMsg.RecipientPhoneNumber,
			"code", code,
			"instanceID", smsMsg.InstanceID,
			"userID", smsMsg.UserID,
		).Info("📱 MOCK SMS отправлен")

		return nil
	})
}

// StoreCode сохраняет код в памяти и выводит в консоль
func (s *MockSMSService) StoreCode(ctx context.Context, phone, code string, codeType CodeType) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.codes[phone] = &StoredCode{
		Code:      code,
		ExpiresAt: time.Now().Add(10 * time.Minute),
		CodeType:  codeType,
	}

	// ВАЖНО: Красиво выводим код в консоль для копирования
	fmt.Printf("\n" + strings.Repeat("=", 70) + "\n")
	fmt.Printf("📱 MOCK SMS для номера: %s\n", phone)
	fmt.Printf("🔐 Код подтверждения: %s\n", code)
	fmt.Printf("⏰ Действителен до: %s\n", s.codes[phone].ExpiresAt.Format("15:04:05"))
	fmt.Printf("📋 Тип: %s\n", codeType)
	fmt.Printf(strings.Repeat("=", 70) + "\n\n")

	logging.WithFields("phone", phone, "code", code, "type", codeType).
		Info("✅ Код сохранен в mock хранилище")

	return nil
}

// VerifyCode проверяет код из памяти
func (s *MockSMSService) VerifyCode(ctx context.Context, phone, code string) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stored, exists := s.codes[phone]
	if !exists {
		logging.WithFields("phone", phone).Warn("❌ Код не найден для номера")
		return false, zerrors.ThrowNotFound(nil, "MOCKSMS-notfound", "код не найден для номера "+phone)
	}

	if time.Now().After(stored.ExpiresAt) {
		logging.WithFields("phone", phone).Warn("❌ Код истек")
		return false, zerrors.ThrowInvalidArgument(nil, "MOCKSMS-expired", "код истек")
	}

	if stored.Code != code {
		logging.WithFields("phone", phone, "expected", stored.Code, "got", code).
			Warn("❌ Неверный код")
		return false, nil
	}

	logging.WithFields("phone", phone).Info("✅ Код подтвержден успешно")
	return true, nil
}

// GetCode возвращает текущий код для номера (для отладки)
func (s *MockSMSService) GetCode(phone string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if stored, exists := s.codes[phone]; exists && time.Now().Before(stored.ExpiresAt) {
		return stored.Code, true
	}
	return "", false
}

// DeleteCode удаляет код после успешной верификации
func (s *MockSMSService) DeleteCode(phone string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.codes, phone)
	logging.WithFields("phone", phone).Debug("🗑️ Код удален из хранилища")
}

// generateCode генерирует случайный 6-значный код
func generateCode() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}
