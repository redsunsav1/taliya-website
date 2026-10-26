#!/bin/bash
# Деплой на Timeweb VPS
# Заливает код, НЕ трогая данные (content.json, admin.json) и загруженные фото
#
# Сервер: tali-ya.ru (старый IP 93.183.81.174 больше не наш — не использовать)
# Ключ сервера (ED25519): SHA256:qL8spyAetswBa8t2sE3Ddq69NjpA4P8hOV7aUXpEZVU
#
# Проверить, что уедет, без загрузки:  ./deploy.sh --dry-run

set -e

SERVER="root@tali-ya.ru"
SSH_KEY="$HOME/.ssh/id_ed25519_taliya"
REMOTE_PATH="/var/www/taliya-website/"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)/"
PM2_NAME="taliya"

SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes"

DRY_RUN=""
if [ "$1" = "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "Пробный прогон: файлы не загружаются"
fi

rsync -avz $DRY_RUN \
  -e "ssh $SSH_OPTS" \
  --exclude 'data/' \
  --exclude 'public/uploads/' \
  --exclude 'node_modules/' \
  --exclude '.claude/' \
  --exclude '.git/' \
  --exclude '.backup*' \
  --exclude 'deploy.sh' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  --exclude '*.docx' \
  --exclude '*.log' \
  "$LOCAL_PATH" "$SERVER:$REMOTE_PATH"

if [ -n "$DRY_RUN" ]; then
  echo "Пробный прогон завершён"
  exit 0
fi

ssh $SSH_OPTS "$SERVER" "cd $REMOTE_PATH && pm2 restart $PM2_NAME && sleep 3 && curl -s -o /dev/null -w 'Главная: %{http_code}\n' -H 'Host: tali-ya.ru' http://127.0.0.1:3000/"

echo "Готово! Сайт обновлён."
