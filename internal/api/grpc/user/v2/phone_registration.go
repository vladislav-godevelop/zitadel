package user

import (
	"context"

	"github.com/zitadel/logging"

	"github.com/zitadel/zitadel/internal/api/authz"
	"github.com/zitadel/zitadel/internal/command"
	"github.com/zitadel/zitadel/internal/domain"
	"github.com/zitadel/zitadel/internal/zerrors"
)

// RegisterByPhoneRequest - минимальная структура для запроса
type RegisterByPhoneRequest struct {
	Phone          string
	ReturnCode     bool
	OrganizationID *string
}

// RegisterByPhoneResponse - минимальная структура для ответа
type RegisterByPhoneResponse struct {
	UserID           string
	VerificationCode *string
}

// VerifyPhoneRegistrationRequest - запрос для верификации
type VerifyPhoneRegistrationRequest struct {
	UserID           string
	VerificationCode string
}

// VerifyPhoneRegistrationResponse - ответ после верификации
type VerifyPhoneRegistrationResponse struct {
	Success bool
}

// RegisterByPhone - Шаг 1: Регистрация по телефону
func (s *Server) RegisterByPhone(ctx context.Context, req *RegisterByPhoneRequest) (*RegisterByPhoneResponse, error) {
	// Определяем organization
	orgID := authz.GetCtxData(ctx).OrgID
	if req.OrganizationID != nil && *req.OrganizationID != "" {
		orgID = *req.OrganizationID
	}
	if orgID == "" {
		instance := authz.GetInstance(ctx)
		if instance != nil {
			orgID = instance.DefaultOrganisationID()
		}
	}

	logging.WithFields("phone", req.Phone, "orgID", orgID).Info("RegisterByPhone: starting registration")

	// Создаем пользователя с phone-only регистрацией
	human := &command.AddHuman{
		Phone: command.Phone{
			Number:     domain.PhoneNumber(req.Phone),
			Verified:   false,
			ReturnCode: req.ReturnCode,
		},
		PhoneOnlyRegistration: true,
		Register:              true, // Self-registration
	}

	// Выполняем команду создания пользователя
	err := s.command.AddUserHuman(ctx, orgID, human, false, s.userCodeAlg)
	if err != nil {
		logging.WithFields("phone", req.Phone, "error", err).Error("RegisterByPhone: failed to create user")
		return nil, err
	}

	response := &RegisterByPhoneResponse{
		UserID: human.ID,
	}

	// Если запрошен код в ответе (для тестирования)
	if req.ReturnCode && human.PhoneCode != nil {
		response.VerificationCode = human.PhoneCode
		// ВАЖНО: Логируем код для тестирования
		logging.WithFields(
			"userID", human.ID,
			"phone", req.Phone,
			"verificationCode", *human.PhoneCode,
		).Info("RegisterByPhone: SMS CODE (для тестирования)")
	}

	logging.WithFields("userID", human.ID, "phone", req.Phone).Info("RegisterByPhone: user created successfully")

	return response, nil
}

// VerifyPhoneRegistration - Шаг 2: Подтверждение SMS кода
func (s *Server) VerifyPhoneRegistration(ctx context.Context, req *VerifyPhoneRegistrationRequest) (*VerifyPhoneRegistrationResponse, error) {
	logging.WithFields("userID", req.UserID, "code", req.VerificationCode).Info("VerifyPhoneRegistration: verifying code")

	// Создаем phone code generator для верификации
	phoneCodeGenerator, err := s.query.InitEncryptionGenerator(ctx, domain.SecretGeneratorTypeVerifyPhoneCode, s.userCodeAlg)
	if err != nil {
		logging.WithFields("userID", req.UserID, "error", err).Error("VerifyPhoneRegistration: failed to init generator")
		return nil, err
	}

	// Верифицируем телефон используя существующую команду
	_, err = s.command.VerifyHumanPhone(
		ctx,
		req.UserID,
		req.VerificationCode,
		"", // resourceOwner будет определен автоматически
		phoneCodeGenerator,
	)
	if err != nil {
		logging.WithFields("userID", req.UserID, "error", err).Error("VerifyPhoneRegistration: verification failed")
		return nil, zerrors.ThrowInvalidArgument(err, "PHONE-Ver1f", "Errors.User.Code.Invalid")
	}

	logging.WithFields("userID", req.UserID).Info("VerifyPhoneRegistration: phone verified successfully")

	return &VerifyPhoneRegistrationResponse{
		Success: true,
	}, nil
}
