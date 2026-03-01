# Деплой сайта «Талия» на Timeweb Cloud

## Какой сервис выбрать?

У Timeweb есть 3 варианта. Для вашего проекта подходят два:

| Вариант | Цена | Сложность | Рекомендация |
|---------|------|-----------|--------------|
| **App Platform** | от 1 ₽/мес | ⭐ Просто | ✅ Лучший вариант |
| **Cloud VPS** | от 199 ₽/мес | ⭐⭐ Средне | Альтернатива |
| Обычный хостинг | от 89 ₽/мес | ❌ | Не подходит для Node.js сервера |

---

## Вариант 1: Timeweb Cloud App Platform (рекомендую)

Это самый простой способ — подключаете GitHub/GitLab, Timeweb сам разворачивает.

### Шаг 1. Загрузите проект на GitHub

Если у вас ещё нет репозитория:

1. Зарегистрируйтесь на [github.com](https://github.com) (бесплатно)
2. Создайте новый репозиторий: кнопка **«New»** → название `taliya-website` → **Private** → Create
3. На своём компьютере откройте терминал (или Git Bash на Windows) в папке с сайтом:

```bash
cd путь/к/папке/taliya-website
git init
git add .
git commit -m "Первый коммит: сайт Талия"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/taliya-website.git
git push -u origin main
```

> **Важно:** файл `.gitignore` уже настроен — `node_modules`, `.env` и загруженные фото не попадут в репозиторий.

### Шаг 2. Создайте приложение в Timeweb Cloud

1. Зайдите на [timeweb.cloud](https://timeweb.cloud) и зарегистрируйтесь
2. В панели управления выберите **«Apps»** (или «Приложения»)
3. Нажмите **«Создать»**
4. Подключите GitHub-аккаунт и выберите репозиторий `taliya-website`
5. Настройки:
   - **Тип**: Backend
   - **Среда**: Node.js
   - **Версия Node.js**: 18 или 20
   - **Команда сборки (Build)**: `npm install`
   - **Команда запуска (Start)**: `npm start`
   - **Порт**: 3000

### Шаг 3. Переменные окружения

В разделе **«Переменные окружения»** добавьте:

| Переменная | Значение |
|-----------|----------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | любая длинная случайная строка (например: `taliya-2024-secret-abc123xyz`) |

### Шаг 4. Запустите деплой

Нажмите **«Развернуть»** (Deploy). Timeweb:
- Скачает код из GitHub
- Установит зависимости (`npm install`)
- Запустит сервер (`npm start`)
- Выдаст URL вида `https://ваш-проект.apps.timeweb.cloud`

### Шаг 5. Привяжите домен (опционально)

1. В настройках приложения → **«Домены»**
2. Добавьте ваш домен (например, `tali-ya.ru`)
3. В DNS вашего домена (у регистратора) добавьте CNAME-запись:
   - Тип: `CNAME`
   - Имя: `@` или `www`
   - Значение: адрес, который даст Timeweb
4. SSL-сертификат подключится автоматически

---

### ⚠️ Важный момент: сохранение данных

Ваш сайт хранит всё в JSON-файлах (`data/content.json`, `data/admin.json`). На App Platform файловая система **может сбрасываться** при каждом деплое.

**Решение — два варианта:**

**A) Коммитить изменения в Git (простой вариант):**
После каждого серьёзного редактирования через админку, файл `data/content.json` нужно будет скачать и закоммитить в GitHub. Это не очень удобно, но работает.

**B) Подключить Persistent Storage (надёжный вариант):**
Если App Platform Timeweb поддерживает Persistent Volume — подключите его к папке `/data`. Тогда данные сохранятся между деплоями.

---

## Вариант 2: Timeweb Cloud VPS (надёжнее для админки)

Если хотите, чтобы изменения через админку гарантированно сохранялись — берите VPS.

### Шаг 1. Создайте VPS

1. В панели Timeweb Cloud → **«Облачные серверы»** → **«Создать»**
2. Параметры:
   - **ОС**: Ubuntu 22.04
   - **Тариф**: минимальный (1 CPU, 1 GB RAM, 15 GB SSD) — хватит с запасом
   - **Регион**: Москва или Санкт-Петербург
3. Запомните IP-адрес и root-пароль

### Шаг 2. Подключитесь к серверу

```bash
ssh root@ВАШ_IP_АДРЕС
```

### Шаг 3. Установите Node.js и PM2

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Устанавливаем PM2 (менеджер процессов)
npm install -g pm2

# Устанавливаем nginx (веб-сервер)
apt install -y nginx

# Проверяем
node --version  # должно быть v20.x.x
pm2 --version
```

### Шаг 4. Загрузите проект

```bash
# Создаём директорию
mkdir -p /var/www
cd /var/www

# Клонируем из GitHub
git clone https://github.com/ВАШ_ЛОГИН/taliya-website.git
cd taliya-website

# Устанавливаем зависимости
npm install --production

# Создаём .env
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
SESSION_SECRET=ваша-случайная-строка-здесь
EOF
```

### Шаг 5. Запустите через PM2

```bash
# Запускаем
pm2 start ecosystem.config.js

# Сохраняем, чтобы запускалось после перезагрузки
pm2 save
pm2 startup
```

### Шаг 6. Настройте nginx

```bash
cat > /etc/nginx/sites-available/taliya << 'EOF'
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    client_max_body_size 10M;

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
EOF

# Включаем сайт
ln -s /etc/nginx/sites-available/taliya /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### Шаг 7. SSL-сертификат (бесплатный)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Certbot автоматически настроит HTTPS и будет обновлять сертификат.

### Шаг 8. Обновление сайта в будущем

Когда нужно обновить код:

```bash
cd /var/www/taliya-website
git pull
npm install --production
pm2 restart taliya
```

---

## Что делать после запуска

1. ✅ Откройте сайт — проверьте, что все страницы работают
2. ✅ Откройте `/admin` — войдите (admin / admin123)
3. ✅ **Сразу смените пароль!** → Админка → Пароль
4. ✅ Проверьте, что форма обратного звонка работает
5. ✅ Проверьте все прайс-листы
6. ✅ В настройках DNS домена направьте его на сервер

---

## Быстрая помощь

| Проблема | Решение |
|----------|---------|
| Сайт не открывается | `pm2 logs taliya` — смотрите ошибки |
| Забыли пароль админки | На сервере удалите `data/admin.json` и перезапустите — создастся admin/admin123 |
| Нужно обновить контент | Зайдите в `/admin`, внесите изменения |
| Хотите вернуть старую версию | `git log` → `git checkout <commit>` → `pm2 restart taliya` |
