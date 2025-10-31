# 📱 Тестирование Phone Registration - ГОТОВО К ЗАПУСКУ

## ✅ Что реализовано

1. ✅ **Команды модифицированы** - добавлен флаг `PhoneOnlyRegistration` в `internal/command/user_human.go`
2. ✅ **Валидация** - специальная логика для phone-only регистрации
3. ✅ **HTTP REST endpoints** - готовы к использованию
4. ✅ **Логирование SMS кодов** - коды выводятся в логи для тестирования
5. ✅ **Код компилируется** - проверено, ошибок нет

---

## 🚀 Запуск ZITADEL

```bash
cd /home/user/GolandProjects/zitadel-my

# Скомпилировать
go build -o zitadel .

# Запустить (замените на ваш способ запуска)
./zitadel start

# ИЛИ через Docker Compose
docker-compose up
```

---

## 🧪 Тестирование через curl

### Шаг 1: Регистрация по телефону

```bash
curl -X POST http://localhost:8080/v2/users/register/phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79001234567",
    "return_code": true
  }'
```

**Ожидаемый ответ:**
```json
{
  "user_id": "283745927364",
  "verification_code": "123456",
  "details": {
    "sequence": "1",
    "resourceOwner": "org-id",
    "eventDate": "2024-01-01T10:00:00Z"
  }
}
```

**ВАЖНО:** Код также будет в логах ZITADEL:
```
INFO: RegisterByPhone: ✅ SMS CODE (для тестирования)
  userID: 283745927364
  phone: +79001234567
  verificationCode: 123456
```

### Шаг 2: Подтверждение SMS кода

```bash
curl -X POST http://localhost:8080/v2/users/register/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "283745927364",
    "verification_code": "123456"
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "details": {
    "sequence": "2",
    "resourceOwner": "org-id",
    "eventDate": "2024-01-01T10:01:00Z"
  }
}
```

---

## 🔍 Проверка в логах

Запустите ZITADEL с verbose логированием:

```bash
ZITADEL_LOG_LEVEL=debug ./zitadel start
```

Искать в логах:
- `RegisterByPhone: starting registration` - начало регистрации
- `RegisterByPhone: ✅ SMS CODE (для тестирования)` - **ТУТ БУДЕТ КОД**
- `RegisterByPhone: ✅ user created successfully` - успешная регистрация
- `VerifyPhoneRegistration: verifying code` - начало верификации
- `VerifyPhoneRegistration: ✅ phone verified successfully` - успешная верификация

---

## 📊 Проверка в базе данных

После успешной регистрации и верификации:

```sql
SELECT id, username, phone, phone_verified, email, passwordless
FROM projections.users
WHERE phone = '+79001234567';

-- Ожидаемый результат:
-- id: 283745927364
-- username: +79001234567
-- phone: +79001234567
-- phone_verified: true (после верификации)
-- email: +79001234567@phone.local
-- passwordless: true
```

---

## ✨ Что происходит под капотом

### При POST /v2/users/register/phone:

1. Валидация номера телефона
2. Создание пользователя с флагом `PhoneOnlyRegistration: true`
3. Автоматическая генерация:
   - Username = номер телефона
   - FirstName = "User"
   - LastName = номер телефона
   - Email = `<phone>@phone.local` (auto-verified)
   - Passwordless = true
4. Генерация SMS кода (6 цифр, срок действия из настроек)
5. **Код выводится в логи** с меткой "✅ SMS CODE (для тестирования)"
6. В production SMS отправляется через Twilio/Webhook (если настроен)

### При POST /v2/users/register/phone/verify:

1. Проверка кода через `commands.VerifyHumanPhone`
2. Если код верный:
   - `phone_verified` = true
   - Пользователь может входить в систему
3. Если код неверный или истек:
   - Ошибка "invalid or expired verification code"

---

## 🎯 Примеры ошибок

### Неверный формат телефона
```bash
curl -X POST http://localhost:8080/v2/users/register/phone \
  -H "Content-Type: application/json" \
  -d '{"phone": "89001234567"}'
```
Ответ: Ошибка нормализации (должен начинаться с +)

### Пустой телефон
```bash
curl -X POST http://localhost:8080/v2/users/register/phone \
  -H "Content-Type: application/json" \
  -d '{"phone": ""}'
```
Ответ: `{"error": "phone number is required"}`

### Неверный код
```bash
curl -X POST http://localhost:8080/v2/users/register/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "283745927364",
    "verification_code": "wrong"
  }'
```
Ответ: `{"error": "invalid or expired verification code"}`

---

## 🐛 Troubleshooting

### Порт 8080 занят
Проверьте, на каком порту запущен ZITADEL:
```bash
./zitadel start --port 9090
```

### База данных не доступна
```bash
# Проверьте подключение к PostgreSQL
psql -U zitadel -d zitadel -h localhost
```

### Логи не показываются
```bash
# Запустите с debug уровнем
ZITADEL_LOG_LEVEL=debug ./zitadel start
```

### Телефон уже зарегистрирован
```sql
-- Удалите тестового пользователя
DELETE FROM projections.users WHERE phone = '+79001234567';
```

---

## 📁 Измененные файлы

1. **internal/command/user_human.go** (строка 88, 97-154)
   - Добавлен флаг `PhoneOnlyRegistration`
   - Специальная валидация для phone-only регистрации

2. **cmd/start/start.go** (строка 720-851)
   - Регистрация HTTP endpoints
   - Inline handlers для избежания import cycles

3. **internal/api/grpc/user/v2/phone_registration.go**
   - gRPC handlers (опциональны, если proto сгенерированы)

---

## 🎉 Готово к тестированию!

Все изменения внесены, код компилируется. Теперь можно:

1. ✅ Запустить ZITADEL
2. ✅ Отправить POST запрос на `/v2/users/register/phone`
3. ✅ Получить SMS код из логов
4. ✅ Подтвердить код через `/v2/users/register/phone/verify`
5. ✅ Проверить в БД, что пользователь создан

**Команда для быстрого теста:**
```bash
# Terminal 1 - запустить ZITADEL
ZITADEL_LOG_LEVEL=debug ./zitadel start 2>&1 | grep -E "(SMS CODE|RegisterByPhone|VerifyPhone)"

# Terminal 2 - тестовые запросы
curl -X POST http://localhost:8080/v2/users/register/phone \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79001234567", "return_code": true}'

# Возьмите user_id и verification_code из ответа
curl -X POST http://localhost:8080/v2/users/register/phone/verify \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "verification_code": "<code>"}'
```

Успехов! 🚀
