# 📱 Инструкция по тестированию Phone Registration

## ✅ Что сделано

1. ✅ **Proto файлы** создан ы (`proto/zitadel/user/v2/phone_registration.proto`)
2. ✅ **gRPC handlers** созданы (`internal/api/grpc/user/v2/phone_registration.go`)
3. ✅ **Команды** модифицированы (`internal/command/user_human.go`)
4. ✅ **Валидация** добавлена для `PhoneOnlyRegistration`
5. ✅ **Логирование** добавлено (SMS код выводится в логи)

---

## 🚀 Как запустить ZITADEL

```bash
cd /home/user/GolandProjects/zitadel-my

# Запустить через Docker Compose (если есть)
docker-compose up -d

# ИЛИ собрать и запустить вручную
go build -o zitadel cmd/zitadel/main.go
./zitadel start-from-init
```

---

## 🧪 Тестирование через grpcurl

### Установка grpcurl (если нет)

```bash
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
```

### Шаг 1: Регистрация по телефону

```bash
grpcurl -plaintext \
  -d '{
    "phone": "+79001234567",
    "return_code": true
  }' \
  localhost:8080 \
  zitadel.user.v2.UserService/RegisterByPhone
```

**Ожидаемый ответ:**
```json
{
  "userId": "283745927364",
  "verificationCode": "123456",
  "details": {
    "sequence": "1",
    "changeDate": "2024-01-01T10:00:00Z",
    "resourceOwner": "org-id"
  }
}
```

**ВАЖНО:** Код также будет в логах:
```
INFO: RegisterByPhone: SMS CODE (для тестирования)
  userID: 283745927364
  phone: +79001234567
  verificationCode: 123456
```

### Шаг 2: Подтверждение SMS кода

```bash
grpcurl -plaintext \
  -d '{
    "user_id": "283745927364",
    "verification_code": "123456"
  }' \
  localhost:8080 \
  zitadel.user.v2.UserService/VerifyPhoneRegistration
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "details": {
    "sequence": "2",
    "changeDate": "2024-01-01T10:01:00Z"
  }
}
```

---

## 🔍 Проверка в логах

Запустите ZITADEL с verbose логированием:

```bash
ZITADEL_LOG_LEVEL=debug ./zitadel start-from-init
```

Искать в логах:
```
RegisterByPhone: SMS CODE (для тестирования)
```

---

## 📊 Проверка через Database

После успешной регистрации проверьте БД:

```sql
-- Проверить созданного пользователя
SELECT id, username, phone, phone_verified, email, passwordless
FROM users
WHERE phone = '+79001234567';

-- Ожидаемый результат:
-- username: +79001234567
-- phone: +79001234567
-- phone_verified: true (после верификации)
-- email: +79001234567@phone.local
-- passwordless: true
```

---

## 🐛 Troubleshooting

### Ошибка: "proto not found"

Если получаете ошибку что proto не найден:

```bash
# Попробовать сгенерировать proto (если buf работает)
buf generate

# Или вручную через protoc
protoc --go_out=. --go-grpc_out=. proto/zitadel/user/v2/phone_registration.proto
```

### Ошибка: "method not found"

Handlers уже добавлены в код, но endpoints могут не работать без полной регенерации proto.

**Альтернатива:** Используйте прямой вызов функций в Go:

```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/zitadel/zitadel/internal/api/grpc/user/v2"
	"github.com/zitadel/zitadel/internal/command"
)

func main() {
	// Создайте server и command
	server := &user.Server{
		// Инициализируйте с нужными зависимостями
	}

	// Шаг 1: Регистрация
	regResp, err := server.RegisterByPhone(context.Background(), &user.RegisterByPhoneRequest{
		Phone:      "+79001234567",
		ReturnCode: true,
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("UserID: %s\n", regResp.UserID)
	fmt.Printf("Code: %s\n", *regResp.VerificationCode)

	// Шаг 2: Верификация
	verifyResp, err := server.VerifyPhoneRegistration(context.Background(), &user.VerifyPhoneRegistrationRequest{
		UserID:           regResp.UserID,
		VerificationCode: *regResp.VerificationCode,
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Success: %v\n", verifyResp.Success)
}
```

---

## 📝 Пример cURL (через REST если настроен grpc-gateway)

```bash
# Шаг 1: Регистрация
curl -X POST http://localhost:8080/v2/users/register/phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79001234567",
    "return_code": true
  }'

# Шаг 2: Верификация
curl -X POST http://localhost:8080/v2/users/register/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<user-id-from-step-1>",
    "verification_code": "123456"
  }'
```

---

## ✨ Что происходит под капотом

### При RegisterByPhone:

1. Валидация номера телефона (нормализация в E164)
2. Создание пользователя с:
   - Username = номер телефона
   - FirstName = "User"
   - LastName = номер телефона
   - Email = `<phone>@phone.local` (auto-verified)
   - Phone = номер телефона (НЕ verified)
   - Passwordless = true
3. Генерация SMS кода (6 цифр, срок действия 30 мин)
4. **Код выводится в логи** (для тестирования)
5. В production SMS отправляется через Twilio/Webhook

### При VerifyPhoneRegistration:

1. Проверка кода
2. Если код верный:
   - Phone.Verified = true
   - Пользователь может входить
3. Если код неверный:
   - Ошибка "Errors.User.Code.Invalid"

---

## 🎉 Success Indicators

✅ Регистрация успешна если:
- Получен UserID
- В логах виден код
- HTTP status 200

✅ Верификация успешна если:
- Success = true
- В БД phone_verified = true
- HTTP status 200

---

## 📞 Контакты

Если возникли проблемы:
1. Проверьте логи ZITADEL
2. Проверьте что БД запущена
3. Проверьте что порт 8080 доступен
4. Проверьте формат номера (должен начинаться с +)

Готово! 🚀
