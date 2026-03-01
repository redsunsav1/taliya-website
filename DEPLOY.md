# Развёртывание сайта «Талия» на Timeweb Cloud

## Вариант 1: Docker (рекомендуется)

### 1. Создайте приложение на Timeweb Cloud
- Перейдите в панель Timeweb Cloud
- Создайте новое приложение > Docker
- Выберите тариф (минимум 1 vCPU, 1GB RAM)

### 2. Подключите Git-репозиторий
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <url-вашего-репо>
git push -u origin main
```

### 3. Настройте переменные окружения
```
PORT=3000
SESSION_SECRET=ваш-секретный-ключ-длинный-и-случайный
NODE_ENV=production
```

### 4. Dockerfile уже готов
Timeweb Cloud автоматически построит образ из Dockerfile.

---

## Вариант 2: VPS (Node.js)

### 1. Создайте VPS на Timeweb Cloud
- Ubuntu 22.04 или новее
- Минимум 1 vCPU, 1GB RAM

### 2. Установите Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Установите PM2
```bash
sudo npm install -g pm2
```

### 4. Загрузите проект
```bash
cd /var/www
git clone <url-вашего-репо> taliya
cd taliya
npm install --production
```

### 5. Настройте переменные окружения
```bash
cp .env.example .env
nano .env
# Заполните SESSION_SECRET и PORT
```

### 6. Запустите через PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Настройте Nginx
```nginx
server {
    listen 80;
    server_name your-domain.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

### 8. SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.ru
```

---

## Вариант 3: Timeweb Cloud Apps (PaaS)

### 1. Создайте Node.js приложение
- Панель Timeweb > Apps > Node.js
- Подключите Git-репозиторий
- Build command: `npm install`
- Start command: `node server.js`

### 2. Переменные окружения
Укажите в панели приложения:
- `PORT` = значение из панели
- `SESSION_SECRET` = длинная случайная строка
- `NODE_ENV` = production

---

## Админ-панель

- URL: `https://your-domain.ru/admin`
- Логин по умолчанию: `admin`
- Пароль по умолчанию: `admin123`
- **ВАЖНО:** Смените пароль после первого входа!

## Интеграция ProfSalon

Кнопка "Записаться онлайн" уже интегрирована:
- Плавающая кнопка в правом нижнем углу на всех страницах
- CTA-кнопки в hero-секции и на страницах услуг
- Ссылка ведёт на: https://profsalon.org/o/D6UNi3
- Изменить ссылку можно в админ-панели: Настройки > ProfSalon URL

## Структура данных

Все данные хранятся в `data/content.json`. При деплое убедитесь, что:
- Директория `data/` доступна для записи
- Директория `public/uploads/` доступна для записи
- Файл `data/admin.json` доступен для записи
