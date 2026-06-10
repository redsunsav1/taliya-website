#!/bin/bash
# Деплой на Timeweb VPS
# Заливает код, НЕ трогая данные (content.json, admin.json)

SERVER="root@93.183.81.174"
REMOTE_PATH="/var/www/taliya-website/"
LOCAL_PATH="$(dirname "$0")/"

rsync -avz \
  --exclude 'data/' \
  --exclude 'node_modules/' \
  --exclude '.claude/' \
  --exclude '.git/' \
  --exclude 'deploy.sh' \
  --exclude '.env' \
  "$LOCAL_PATH" "$SERVER:$REMOTE_PATH"

ssh "$SERVER" "cd $REMOTE_PATH && pm2 restart taliya-website"

echo "Готово! Сайт обновлён."
