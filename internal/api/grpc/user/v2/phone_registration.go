package user

import (
	"context"

	"connectrpc.com/connect"
	"github.com/zitadel/logging"

	"github.com/zitadel/zitadel/internal/api/authz"
	"github.com/zitadel/zitadel/internal/api/grpc/object/v2"
	"github.com/zitadel/zitadel/internal/command"
	"github.com/zitadel/zitadel/internal/domain"
	"github.com/zitadel/zitadel/internal/query"
	"github.com/zitadel/zitadel/internal/zerrors"
	user "github.com/zitadel/zitadel/pkg/grpc/user/v2"
)

// RegisterByPhone - Шаг 1: Регистрация по телефону
func (s *Server) RegisterByPhone(ctx context.Context, req *connect.Request[user.RegisterByPhoneRequest]) (*connect.Response[user.RegisterByPhoneResponse], error) {
	// Определяем organization
	orgID := authz.GetCtxData(ctx).OrgID
	logging.WithFields("authz_orgID", orgID).Debug("RegisterByPhone: orgID from authz context")

	if req.Msg.OrganizationId != nil && *req.Msg.OrganizationId != "" {
		orgID = *req.Msg.OrganizationId
		logging.WithFields("request_orgID", orgID).Debug("RegisterByPhone: orgID from request")
	}

	if orgID == "" {
		instance := authz.GetInstance(ctx)
		logging.WithFields("instance", instance != nil).Debug("RegisterByPhone: getting instance")
		if instance != nil {
			orgID = instance.DefaultOrganisationID()
			logging.WithFields("default_orgID", orgID).Debug("RegisterByPhone: orgID from instance default")
		}
	}

	// Если orgID всё ещё пустой, попробуем найти первую доступную организацию
	if orgID == "" {
		logging.Warn("RegisterByPhone: no default organization configured, searching for any organization")
		// Для публичного endpoint используем пустую permission check функцию
		orgs, err := s.query.SearchOrgs(ctx, &query.OrgSearchQueries{
			Queries: []query.SearchQuery{},
		}, nil) // nil permission check = нет проверки прав доступа
		if err == nil && orgs != nil && len(orgs.Orgs) > 0 {
			orgID = orgs.Orgs[0].ID
			logging.WithFields("fallback_orgID", orgID, "org_name", orgs.Orgs[0].Name).Info("RegisterByPhone: using first available organization")
		}
	}

	// Проверяем, что orgID не пустой
	if orgID == "" {
		logging.Error("RegisterByPhone: organization ID is empty - cannot register user without organization")
		return nil, zerrors.ThrowInvalidArgument(nil, "PHONE-Org01", "organization ID is required for registration. No organizations found in the system. Please create an organization first or provide organization_id in the request")
	}

	logging.WithFields("phone", req.Msg.Phone, "orgID", orgID).Info("RegisterByPhone: starting registration")

	// Создаем пользователя с phone-only регистрацией
	human := &command.AddHuman{
		Phone: command.Phone{
			Number:     domain.PhoneNumber(req.Msg.Phone),
			Verified:   false,
			ReturnCode: req.Msg.ReturnCode,
		},
		PhoneOnlyRegistration: true,
		Register:              true, // Self-registration
	}

	// Выполняем команду создания пользователя
	err := s.command.AddUserHuman(ctx, orgID, human, false, s.userCodeAlg)
	if err != nil {
		logging.WithFields("phone", req.Msg.Phone, "error", err).Error("RegisterByPhone: failed to create user")
		return nil, err
	}

	response := &user.RegisterByPhoneResponse{
		UserId:  human.ID,
		Details: object.DomainToDetailsPb(human.Details),
	}

	// Если запрошен код в ответе (для тестирования)
	if req.Msg.ReturnCode && human.PhoneCode != nil {
		response.VerificationCode = human.PhoneCode
		// ВАЖНО: Логируем код для тестирования
		logging.WithFields(
			"userID", human.ID,
			"phone", req.Msg.Phone,
			"verificationCode", *human.PhoneCode,
		).Info("RegisterByPhone: SMS CODE (для тестирования)")
	}

	logging.WithFields("userID", human.ID, "phone", req.Msg.Phone).Info("RegisterByPhone: user created successfully")

	return connect.NewResponse(response), nil
}

// VerifyPhoneRegistration - Шаг 2: Подтверждение SMS кода
func (s *Server) VerifyPhoneRegistration(ctx context.Context, req *connect.Request[user.VerifyPhoneRegistrationRequest]) (*connect.Response[user.VerifyPhoneRegistrationResponse], error) {
	logging.WithFields("userID", req.Msg.UserId, "code", req.Msg.VerificationCode).Info("VerifyPhoneRegistration: verifying code")

	// Создаем phone code generator для верификации
	phoneCodeGenerator, err := s.query.InitEncryptionGenerator(ctx, domain.SecretGeneratorTypeVerifyPhoneCode, s.userCodeAlg)
	if err != nil {
		logging.WithFields("userID", req.Msg.UserId, "error", err).Error("VerifyPhoneRegistration: failed to init generator")
		return nil, err
	}

	// Верифицируем телефон используя существующую команду
	details, err := s.command.VerifyHumanPhone(
		ctx,
		req.Msg.UserId,
		req.Msg.VerificationCode,
		"", // resourceOwner будет определен автоматически
		phoneCodeGenerator,
	)
	if err != nil {
		logging.WithFields("userID", req.Msg.UserId, "error", err).Error("VerifyPhoneRegistration: verification failed")
		return nil, err
	}

	logging.WithFields("userID", req.Msg.UserId).Info("VerifyPhoneRegistration: phone verified successfully")

	return connect.NewResponse(&user.VerifyPhoneRegistrationResponse{
		Details: object.DomainToDetailsPb(details),
	}), nil
}
