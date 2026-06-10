# Талия — актуальный дизайн и данные

Этот файл фиксирует текущий канон проекта. Основной дизайн сайта — только живая EJS-версия со split hero, тёмно-зелёной карточкой, оранжевыми CTA и левым sidebar.

## 1. Канонический дизайн

Главная страница:
- URL: `/`
- шаблон: `views/pages/home.ejs`
- общий layout/sidebar/head: `views/partials/header.ejs`
- footer/floating CTA: `views/partials/footer.ejs`
- стили: `public/css/style.css`
- скрипты: `public/js/main.js`

Статичные `public/*-v2.html`, `public/css/v2.css`, `public/js/v2.js` больше не являются источником правды и не должны использоваться для разработки. Старые `*-v2.html` URL редиректятся на живые страницы.

## 2. Страницы

Работа идёт только с production-страницами:

| Раздел | URL | Шаблон |
|---|---|---|
| Главная | `/` | `views/pages/home.ejs` |
| О нас | `/about` | `views/pages/about.ejs` |
| Услуга | `/service/:slug` | `views/pages/service.ejs` |
| Мастера | `/team` | `views/pages/team.ejs` |
| Портфолио | `/gallery` | `views/pages/gallery.ejs` |
| Акции | `/promotions` | `views/pages/promotions.ejs` |
| Контакты | `/contacts` | `views/pages/contacts.ejs` |

## 3. Источники данных

Актуальный контент и прайсы лежат в `data/content.json`.

- `site.*` — название, логотип, телефоны, адрес, лицензия, соцсети, ссылки.
- `hero.*` и `hero.slides[]` — главный экран и слайды hero.
- `services[]` — разделы услуг.
- `services[*].items[]` — актуальные позиции прайса.
- `services[*].items[*].price` — базовая цена.
- `services[*].items[*].pricePackage5` и `pricePackage10` — пакетные цены, если есть.
- `services[*].items[*].category` — группировка прайса в аккордеонах.
- `promotions.*`, `benefits[]`, `team.*`, `gallery.*`, `about.*`, `legal.*` — остальные секции сайта.

Не использовать старое поле `services[*].pricing[]` как источник цен: актуальная структура сейчас `services[*].items[]`.

## 4. Визуальные правила

- Сохранять текущий стиль: кремовый фон, глубокий зелёный, тёплый оранжевый акцент, крупные скругления, плотная премиальная композиция.
- Не возвращать старый бело-зелёный `home-v2.html` дизайн.
- Не подключать `css/v2.css` или `js/v2.js`.
- Для новых блоков использовать существующие токены и компоненты из `public/css/style.css`.
- Навигация и контакты должны оставаться едиными через `views/partials/header.ejs` и `views/partials/footer.ejs`.

## 5. Проверка

```bash
npm start
open http://localhost:3000/
```

Контрольные признаки правильного дизайна: на главной есть `.hero-split`, заголовок `ТАЛИЯ`, тёмно-зелёная hero-карточка, промо `Скидка на первый сеанс до -50%`, справа фото с бейджем `Медицинская лицензия`.
