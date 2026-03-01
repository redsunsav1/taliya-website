# Content Structure for EJS Views

This document describes the expected structure of data in `content.json` for all EJS views to render correctly.

## Required Content Object Properties

### contact
Required for all legal pages (privacy, terms, consent)

```json
{
  "contact": {
    "address": "Адрес компании",
    "phone": "+7 (XXX) XXX-XX-XX",
    "email": "email@example.com"
  }
}
```

### about
For `/pages/about.ejs`

```json
{
  "about": {
    "text": "Многопараграфный текст\nк компании\nС переносами строк",
    "license": "ЛО № 77-01-... МЗ РФ",
    "certificates": "Список сертификатов",
    "values": [
      {
        "icon": "heart",
        "title": "Забота",
        "description": "Мы заботимся о каждом клиенте"
      },
      {
        "icon": "star",
        "title": "Качество",
        "description": "Высочайшее качество услуг"
      }
    ]
  }
}
```

### team
For `/pages/team.ejs`

```json
{
  "team": {
    "title": "Наша команда",
    "subtitle": "Профессионалы с опытом",
    "members": [
      {
        "name": "Иван Иванов",
        "role": "Пластический хирург",
        "experience": 15,
        "bio": "Специалист с 15-летним опытом",
        "photo": "/images/team/ivan.jpg",
        "specialties": ["Филлеры", "Ботокс", "Пластика век"]
      }
    ]
  }
}
```

### gallery
For `/pages/gallery.ejs`

```json
{
  "gallery": {
    "title": "Галерея работ",
    "subtitle": "Результаты наших процедур",
    "categories": [
      {
        "id": "face",
        "name": "Лицо"
      },
      {
        "id": "body",
        "name": "Тело"
      }
    ],
    "images": [
      {
        "src": "/images/gallery/work1.jpg",
        "thumb": "/images/gallery/work1-thumb.jpg",
        "title": "Омолаживающая процедура",
        "description": "Результат после 3 сеансов",
        "category": "face"
      }
    ]
  }
}
```

### promotions
For `/pages/promotions.ejs`

```json
{
  "promotions": {
    "title": "Акции и предложения",
    "subtitle": "Специальные предложения для вас",
    "items": [
      {
        "active": true,
        "badge": {
          "type": "danger",
          "text": "Хит продаж"
        },
        "title": "Инъекции красоты",
        "description": "Омолаживающие процедуры",
        "details": [
          "Консультация бесплатно",
          "Безопасные препараты",
          "Опытный специалист"
        ],
        "discount": "-30%",
        "validUntil": "31.03.2026"
      }
    ]
  }
}
```

### services
For callback form service select (used in all pages with callback form)

```json
{
  "services": [
    {
      "id": "botox",
      "name": "Ботулинотерапия"
    },
    {
      "id": "fillers",
      "name": "Филлеры"
    },
    {
      "id": "laser",
      "name": "Лазерная косметология"
    }
  ]
}
```

## Complete Example content.json

```json
{
  "contact": {
    "address": "Москва, ул. Примерная, д. 1",
    "phone": "+7 (495) 123-45-67",
    "email": "info@taliya.ru"
  },
  "services": [
    {
      "id": "botox",
      "name": "Ботулинотерапия"
    },
    {
      "id": "fillers",
      "name": "Филлеры"
    },
    {
      "id": "laser",
      "name": "Лазерная косметология"
    },
    {
      "id": "peeling",
      "name": "Химический пилинг"
    }
  ],
  "about": {
    "text": "ООО «МЕДИКА+» - один из ведущих косметологических центров Москвы.\nМы предлагаем полный спектр услуг по уходу за лицом и телом.\nНаша миссия - помочь каждому клиенту раскрыть свою естественную красоту.",
    "license": "ЛО № 77-01-013816 МЗ РФ",
    "certificates": "Все специалисты имеют сертификаты и повышают квалификацию ежегодно",
    "values": [
      {
        "icon": "heart",
        "title": "Забота о клиентах",
        "description": "Каждый клиент для нас важен и ценен"
      },
      {
        "icon": "star",
        "title": "Качество услуг",
        "description": "Используем только проверенные препараты"
      },
      {
        "icon": "shield",
        "title": "Безопасность",
        "description": "Строгое соблюдение протоколов безопасности"
      }
    ]
  },
  "team": {
    "title": "Наша команда специалистов",
    "subtitle": "Опытные профессионалы в области косметологии",
    "members": [
      {
        "name": "Иван Иванович Петров",
        "role": "Врач-косметолог",
        "experience": 15,
        "bio": "Специалист по инъекционным техникам",
        "photo": "/images/team/petrov.jpg",
        "specialties": ["Ботулинотерапия", "Филлеры", "Плазмотерапия"]
      },
      {
        "name": "Мария Сергеевна Сидорова",
        "role": "Пластический хирург",
        "experience": 12,
        "bio": "Специалист по микропластике",
        "photo": "/images/team/sidorova.jpg",
        "specialties": ["Контурная пластика", "Липолитики", "Биоревитализация"]
      }
    ]
  },
  "gallery": {
    "title": "Галерея наших работ",
    "subtitle": "Реальные результаты наших процедур",
    "categories": [
      {
        "id": "face",
        "name": "Лицо"
      },
      {
        "id": "body",
        "name": "Тело"
      },
      {
        "id": "lips",
        "name": "Губы"
      }
    ],
    "images": [
      {
        "src": "/images/gallery/face-1.jpg",
        "thumb": "/images/gallery/face-1-thumb.jpg",
        "title": "Омолаживающий курс",
        "description": "Ботулинотерапия + филлеры",
        "category": "face"
      },
      {
        "src": "/images/gallery/lips-1.jpg",
        "thumb": "/images/gallery/lips-1-thumb.jpg",
        "title": "Объемные губы",
        "description": "Гиалуроновые филлеры",
        "category": "lips"
      }
    ]
  },
  "promotions": {
    "title": "Специальные предложения",
    "subtitle": "Экономьте на красоте вместе с нами",
    "items": [
      {
        "active": true,
        "badge": {
          "type": "danger",
          "text": "Топ продаж"
        },
        "title": "Курс молодости",
        "description": "Полное омолаживание лица за 4 процедуры",
        "details": [
          "Консультация бесплатно",
          "Использование премиум препаратов",
          "Гарантия результата",
          "Рассрочка платежа доступна"
        ],
        "discount": "-35%",
        "validUntil": "31.03.2026"
      },
      {
        "active": true,
        "badge": {
          "type": "warning",
          "text": "Новое предложение"
        },
        "title": "Объемная коррекция губ",
        "description": "Идеальный объем и форма за одну процедуру",
        "details": [
          "Безболезненно",
          "Результат видна сразу",
          "Безопасные материалы"
        ],
        "discount": "-20%",
        "validUntil": "15.04.2026"
      }
    ]
  }
}
```

## Notes

1. **Text with Line Breaks**: Use `\n` in `about.text` to create paragraph breaks
2. **Icons**: All icons reference Lucide Icons available icons
3. **Images**: Provide both full size (`src`) and thumbnail (`thumb`) for gallery
4. **Active Status**: Set `active: false` to hide promotions
5. **Validation**: All required fields must be present or template will show fallback text
6. **Phone Number**: Should include country code (+7 for Russia)

## Conditional Rendering

All sections are wrapped in conditional checks (`<% if (content.X) { %>`) so missing sections won't break the page - they'll just display fallback text or be skipped entirely.
