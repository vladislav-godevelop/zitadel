#!/bin/bash

# Скрипт для полной пересборки проекта без кеша
# Использование: ./rebuild.sh

set -e  # Остановка при ошибке

echo "=== Шаг 1: Остановка контейнеров ==="
docker-compose down

echo ""
echo "=== Шаг 2: Удаление старых образов ==="
docker rmi -f login_zitadel login_login 2>/dev/null || echo "Образы уже удалены"

echo ""
echo "=== Шаг 3: Очистка неиспользуемых образов и кеша сборки ==="
docker system prune -f

echo ""
echo "=== Шаг 4: Пересборка БЕЗ кеша ==="
docker-compose build --no-cache

echo ""
echo "=== Шаг 5: Запуск контейнеров ==="
docker-compose up -d

echo ""
echo "=== Готово! Проверка статуса ==="
docker-compose ps

echo ""
echo "=== Просмотр логов (Ctrl+C для выхода) ==="
docker-compose logs -f
