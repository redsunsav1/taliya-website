# Запуск taliya-website на Timeweb Cloud

> Полная инструкция: от создания сервера до работающего сайта с админкой

---

## Что нужно заранее

- Аккаунт на [Timeweb Cloud](https://timeweb.cloud)
- Репозиторий `taliya-website` на GitHub
- Терминал на Mac (Terminal или iTerm)

---

## Шаг 1. Создать Cloud-сервер (VPS)

> Почему VPS, а не «Приложения»? Ваш сайт хранит данные в JSON-файлах и загруженные фото на диске. VPS даёт постоянную файловую систему — всё сохраняется между перезагрузками.

1. Зайдите в [Timeweb Cloud](https://timeweb.cloud) → **Облачные серверы** → **Создать**
2. Настройки сервера:

| Параметр | Значение |
|----------|----------|
| **Образ** | Ubuntu 22.04 |
| **Регион** | Россия (Москва или Санкт-Петербург) |
| **Конфигурация** | 1 vCPU, 1 GB RAM, 15 GB SSD (минимальная — хватит) |
| **Сеть** | Публичный IP (включён по умолчанию) |

3. Нажмите **Создать** — через ~1 минуту сервер будет готов
4. Запишите **IP-адрес** и **root-пароль** (придут на почту и в панели)

---

## Шаг 2. Подключиться к серверу

Откройте терминал на Mac:

```bash
ssh root@ВАШ_IP_АДРЕС
```

При первом подключении введите `yes`, затем пароль.

---

## Шаг 3. Установить всё необходимое

Выполните команды по очереди:

```bash
# Обновить систему
apt update && apt upgrade -y

# Установить Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Проверить установку
node -v    # должно показать v18.x.x
npm -v     # должно показать 9.x.x или 10.x.x

# Установить PM2 (менеджер процессов — держит сайт запущенным)
npm install -g pm2

# Установить Nginx (будет перенаправлять порт 80 → 3000)
apt install -y nginx

# Установить Git
apt install -y git
```

---

## Шаг 4. Клонировать проект с GitHub

```bash
# Перейти в папку для сайтов
cd /var/www

# Клонировать репозиторий
git clone https://github.com/ВАШ_ЮЗЕРНЕЙМ/taliya-website.git

# Перейти в папку проекта
cd taliya-website

# Установить зависимости
npm ci --only=production

# Создать нужные папки (если их нет)
mkdir -p public/uploads data
```

---

## Шаг 5. Настроить переменные окружения

```bash
# Создать файл .env
nano .env
```

Вставьте следующее (нажмите Ctrl+Shift+V для вставки):

```env
PORT=3000
SESSION_SECRET=ЗАМЕНИТЕ_НА_СЛУЧАЙНУЮ_СТРОКУ_МИНИМУМ_32_СИМВОЛА
NODE_ENV=production
```

**Сгенерировать случайную строку для SESSION_SECRET:**

```bash
# Выполните это в другом окне терминала
openssl rand -hex 32
```

Скопируйте результат и вставьте вместо `ЗАМЕНИТЕ_НА_СЛУЧАЙНУЮ_СТРОКУ_МИНИМУМ_32_СИМВОЛА`.

Сохраните файл: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Шаг 6. Запустить сайт через PM2

```bash
# Запустить приложение
pm2 start ecosystem.config.js

# Проверить что работает
pm2 status
```

Вы должны увидеть:

```
┌────┬──────────┬─────────┬──────┬───────────┐
│ id │ name     │ mode    │ ↺    │ status    │
├────┼──────────┼─────────┼──────┼───────────┤
│ 0  │ taliya   │ fork    │ 0    │ online    │
└────┴──────────┴─────────┴──────┴───────────┘
```

```bash
# Настроить автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

**Проверьте:** откройте в браузере `http://ВАШ_IP_АДРЕС:3000` — должен открыться сайт.

---

## Шаг 7. Настроить Nginx (чтобы сайт открывался без :3000)

```bash
# Создать конфигурацию Nginx
nano /etc/nginx/sites-available/taliya
```

Вставьте:

```nginx
server {
    listen 80;
    server_name ВАШ_IP_АДРЕС;
    # Когда подключите домен, замените строку выше на:
    # server_name taliya.ru www.taliya.ru;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Сохраните: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# Активировать конфигурацию
ln -s /etc/nginx/sites-available/taliya /etc/nginx/sites-enabled/

# Удалить стандартную конфигурацию
rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию на ошибки
nginx -t

# Перезапустить Nginx
systemctl restart nginx
```

**Проверьте:** откройте `http://ВАШ_IP_АДРЕС` (без порта) — сайт должен работать.

---

## Шаг 8. Проверить админку

1. Откройте `http://ВАШ_IP_АДРЕС/admin/login`
2. Войдите:
   - **Логин:** `admin`
   - **Пароль:** `admin123`
3. **Сразу смените пароль** в разделе «Смена пароля»
4. Попробуйте что-нибудь изменить (например, заголовок на главной) и проверьте, что изменения видны на сайте

> Все изменения сохраняются в файлы `/var/www/taliya-website/data/` и загруженные фото в `/var/www/taliya-website/public/uploads/` — они никуда не денутся при перезагрузке.

---

## Шаг 9. Подключить домен (опционально)

### 9.1. Купить домен

Можно прямо в Timeweb Cloud: **Домены** → **Зарегистрировать** (или использовать домен с другого регистратора).

### 9.2. Настроить DNS

В настройках домена создайте A-запись:

| Тип | Имя | Значение |
|-----|-----|----------|
| A   | @   | ВАШ_IP_АДРЕС |
| A   | www | ВАШ_IP_АДРЕС |

DNS обновится в течение 5–30 минут (иногда до 24 часов).

### 9.3. Обновить Nginx

```bash
nano /etc/nginx/sites-available/taliya
```

Замените строку `server_name` на ваш домен:

```nginx
server_name taliya.ru www.taliya.ru;
```

```bash
nginx -t && systemctl restart nginx
```

---

## Шаг 10. Установить SSL-сертификат (HTTPS)

```bash
# Установить Certbot
apt install -y certbot python3-certbot-nginx

# Получить сертификат (замените домен на свой)
certbot --nginx -d taliya.ru -d www.taliya.ru
```

Certbot спросит email и согласие с условиями. После установки сертификата сайт будет доступен по `https://`.

```bash
# Автообновление сертификата (уже настроено, но проверим)
certbot renew --dry-run
```

---

## Обновление сайта (когда вносите изменения в код)

### Вариант A: Через GitHub (рекомендуется)

На Mac: закоммитьте и запушьте изменения в GitHub.

На сервере:

```bash
cd /var/www/taliya-website
git pull
npm ci --only=production
pm2 restart taliya
```

### Вариант B: Быстрое обновление одной командой

Добавьте alias на сервере:

```bash
echo 'alias deploy="cd /var/www/taliya-website && git pull && npm ci --only=production && pm2 restart taliya"' >> ~/.bashrc
source ~/.bashrc
```

Теперь для обновления просто введите:

```bash
deploy
```

---

## Полезные команды

| Команда | Что делает |
|---------|-----------|
| `pm2 status` | Статус приложения |
| `pm2 logs taliya` | Логи в реальном времени |
| `pm2 restart taliya` | Перезапустить сайт |
| `pm2 stop taliya` | Остановить сайт |
| `pm2 monit` | Мониторинг (CPU, RAM) |
| `systemctl status nginx` | Статус Nginx |
| `systemctl restart nginx` | Перезапустить Nginx |

---

## Бэкап данных

Данные хранятся в двух местах — создавайте их копии регулярно:

```bash
# Создать папку для бэкапов
mkdir -p /var/backups/taliya

# Скрипт бэкапа (сохраняет данные + загрузки с датой)
cat > /var/backups/taliya/backup.sh << 'SCRIPT'
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/var/backups/taliya"
SOURCE="/var/www/taliya-website"

tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" "$SOURCE/data/" "$SOURCE/public/uploads/"
echo "Бэкап создан: data_$DATE.tar.gz"

# Удалить бэкапы старше 30 дней
find "$BACKUP_DIR" -name "data_*.tar.gz" -mtime +30 -delete
SCRIPT

chmod +x /var/backups/taliya/backup.sh

# Автоматический бэкап каждый день в 3:00 ночи
(crontab -l 2>/dev/null; echo "0 3 * * * /var/backups/taliya/backup.sh") | crontab -
```

---

## Решение проблем

**Сайт не открывается:**
```bash
pm2 logs taliya --lines 50    # посмотреть логи приложения
systemctl status nginx         # проверить Nginx
```

**Ошибка 502 Bad Gateway:**
```bash
pm2 restart taliya             # перезапустить приложение
```

**Нет прав на запись (админка не сохраняет):**
```bash
chown -R www-data:www-data /var/www/taliya-website/data/
chown -R www-data:www-data /var/www/taliya-website/public/uploads/
chmod -R 755 /var/www/taliya-website/data/
chmod -R 755 /var/www/taliya-website/public/uploads/
```

**Фото не загружаются:**
```bash
# Проверить что папка uploads существует и доступна
ls -la /var/www/taliya-website/public/uploads/
mkdir -p /var/www/taliya-website/public/uploads/
chmod 755 /var/www/taliya-website/public/uploads/
```

**Обновить Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
pm2 restart taliya
```

---

## Итоговая архитектура

```
Пользователь
     │
     ▼
[ Домен / IP ]
     │
     ▼
[ Nginx :80/:443 ] ← SSL-сертификат (Let's Encrypt)
     │
     ▼
[ Node.js :3000 ]  ← PM2 (автоперезапуск)
     │
     ├── /data/content.json     ← контент сайта
     ├── /data/admin.json       ← логин/пароль админа
     ├── /data/callbacks.json   ← заявки с формы
     └── /public/uploads/       ← загруженные фото
```

Всё работает на одном сервере. Админка сохраняет изменения в JSON-файлы на диск — они видны всем посетителям сразу после сохранения.
