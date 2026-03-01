# Taliya Beauty Center - Express Server Complete Documentation

## File Information
- **Location**: `/sessions/sharp-amazing-cori/mnt/taliya-website/server.js`
- **Size**: 760 lines
- **Status**: ✅ All routes implemented and tested

---

## Public Routes (Customer-facing)

### Home & Navigation
```
GET /                    → Renders home page (views/pages/home.ejs)
GET /contacts            → Renders contact form page (views/pages/contacts.ejs)
GET /service/:slug       → Renders individual service page (views/pages/service.ejs)
```

### New Content Pages
```
GET /about               → About page with team description
GET /team                → Team/specialists listing
GET /gallery             → Image gallery
GET /promotions          → Promotional offers
GET /privacy             → Privacy policy
GET /terms               → Terms of service
GET /consent             → Personal data consent form
```

### Forms & APIs
```
POST /callback           → Contact form submission
  Request body:
    - name (required)
    - phone (required)
    - service (optional)
    - message (optional)
  Response: { success: true, message: 'Заявка принята' }
  Storage: data/callbacks.json
```

### SEO & Crawlers
```
GET /sitemap.xml         → XML sitemap with all pages and services
GET /robots.txt          → Robots.txt file for search engines
```

---

## Admin Routes (Requires Authentication)

All admin routes require `requireAuth` middleware - check `req.session.authenticated`

### Authentication
```
GET  /admin/login        → Login form (no auth required)
POST /admin/login        → Handle login with username/password
GET  /admin/logout       → Destroy session and redirect to login
GET  /admin              → Admin dashboard (protected)
```

### Site Settings
```
GET  /admin/settings     → Edit site basic info
POST /admin/settings     → Save site settings (name, phone, address, social links, etc.)
```

### Hero Section Management
```
GET  /admin/hero         → Edit hero banner
POST /admin/hero         → Update hero (title, subtitle, promo text, image upload)
```

### Benefits Management
```
GET  /admin/benefits     → Edit benefits list
POST /admin/benefits     → Save benefits (icon, title, text for each benefit)
```

### Services Management (Full CRUD)
```
GET  /admin/services     → List all services
GET  /admin/services/:slug    → Edit specific service
POST /admin/services/:slug    → Update service with image, items, advantages, doctors
POST /admin/services-add      → Create new service
POST /admin/services/:slug/delete → Delete service
```

### About Page
```
GET  /admin/about        → Edit about page
POST /admin/about        → Save about (title and rich content)
```

### Team Page
```
GET  /admin/team         → Edit team members
POST /admin/team         → Save team (name, role, bio, photo for each member)
```

### Gallery
```
GET  /admin/gallery      → Edit gallery
POST /admin/gallery      → Upload images (up to 20 files) and manage captions
```

### Promotions
```
GET  /admin/promotions   → Edit promotions
POST /admin/promotions   → Save promotions (title, description, code, discount for each item)
```

### Legal Pages
```
GET  /admin/legal        → Edit legal pages
POST /admin/legal        → Save privacy policy, terms, and consent text
```

### SEO Settings
```
GET  /admin/seo          → Edit SEO metadata
POST /admin/seo          → Save title, description, keywords, canonical URL
```

### Pages Visibility
```
GET  /admin/pages        → Manage which pages are visible
POST /admin/pages        → Save visibility settings (about, team, gallery, etc.)
```

### Callback Management
```
GET  /admin/callbacks    → View all contact form submissions
POST /admin/callbacks/:id/delete → Delete a callback
POST /admin/callbacks/:id/read   → Mark as read/unread
```

### Security
```
GET  /admin/password     → Change password form
POST /admin/password     → Update admin password (requires current password)
```

### File Uploads
```
POST /admin/upload       → Upload image file
  Returns: { url: '/uploads/filename.ext' }
```

---

## Data Storage

### content.json Structure
```json
{
  "site": {
    "name": "Талия",
    "tagline": "Центр эстетики тела и косметологии",
    "phone": "+7 (985) 220-01-06",
    "phoneRaw": "+79852200106",
    "address": "...",
    "hours": "Ежедневно 10:00–22:00",
    "vk": "https://vk.com/...",
    "telegram": "https://t.me/...",
    "whatsapp": "https://wa.me/...",
    "profsalon": "...",
    "license": "...",
    "company": "..."
  },
  "hero": {
    "title": "...",
    "subtitle": "...",
    "promoText": "...",
    "promoNote": "...",
    "image": "/uploads/..."
  },
  "benefits": [
    { "icon": "shield-check", "title": "...", "text": "..." }
  ],
  "services": [
    {
      "id": "slug",
      "slug": "slug",
      "name": "...",
      "shortName": "...",
      "description": "...",
      "image": "...",
      "icon": "...",
      "discount": "...",
      "items": [{ "name": "...", "price": "..." }],
      "advantages": [{ "icon": "...", "title": "...", "text": "..." }],
      "doctors": [{ "name": "...", "role": "...", "experience": "...", "photo": "..." }]
    }
  ],
  "pages": {
    "about": { "visible": true },
    "team": { "visible": true },
    "gallery": { "visible": true },
    "promotions": { "visible": true },
    "privacy": { "visible": true },
    "terms": { "visible": true },
    "consent": { "visible": true }
  },
  "about": {
    "title": "О нас",
    "content": "..."
  },
  "team": {
    "title": "Специалисты",
    "members": [
      { "name": "...", "role": "...", "bio": "...", "photo": "..." }
    ]
  },
  "gallery": {
    "title": "Галерея",
    "images": [
      { "url": "/uploads/...", "caption": "..." }
    ]
  },
  "promotions": {
    "title": "Акции",
    "items": [
      { "title": "...", "description": "...", "code": "...", "discount": "..." }
    ]
  },
  "legal": {
    "privacy": "Текст политики конфиденциальности...",
    "terms": "Текст условий использования...",
    "consent": "Текст согласия на обработку данных..."
  },
  "seo": {
    "title": "Талия - Центр косметологии",
    "description": "...",
    "keywords": "...",
    "canonical": "..."
  }
}
```

### callbacks.json Structure
```json
[
  {
    "id": "1704067200000",
    "name": "Иван Петров",
    "phone": "+7 (985) 123-45-67",
    "service": "Врачебная косметология",
    "message": "Интересует процедура омоложения",
    "submittedAt": "2024-01-01T12:00:00.000Z",
    "read": false
  }
]
```

### admin.json Structure
```json
{
  "username": "admin",
  "password": "$2a$10$..." (bcrypt hash)
}
```

---

## Key Features

### Authentication
- Session-based authentication using `express-session`
- Password hashing with `bcryptjs`
- Admin password initialization on first run (credentials: admin/admin123)
- 24-hour session timeout

### File Handling
- Multer for file uploads
- Automatic directory creation
- File size limit: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF, WebP, SVG
- Uploads stored in: `/public/uploads/`

### Rendering
- EJS templating engine
- Views location: `/views/`
- Content automatically available in all views via `res.locals.content`

### Data Persistence
- JSON file-based storage (no database)
- Automatic file creation if missing
- Error handling with fallback defaults

---

## Environment Variables

```bash
PORT          - Server port (default: 3000)
SESSION_SECRET - Session encryption secret (default: taliya-secret-key-change-in-production)
```

---

## File Paths Used

```
/data/content.json      - Main website content
/data/admin.json        - Admin credentials
/data/callbacks.json    - Contact form submissions
/public/                - Static files (CSS, JS, images)
/public/uploads/        - Uploaded images
/views/                 - EJS templates
/views/pages/           - Public pages
/views/admin/           - Admin pages
```

---

## Error Handling

- 404 page for non-existent routes
- Try-catch in callback form submission
- Input validation (name, phone required for callbacks)
- Graceful fallbacks for missing data files
- Proper HTTP status codes

---

## Preserved Original Functionality

✅ Home page
✅ Contact page
✅ Service detail pages
✅ Hero management with image upload
✅ Benefits management
✅ Services CRUD with items, advantages, doctors
✅ Site settings (phone, address, social links, etc.)
✅ Admin authentication
✅ Password change
✅ File upload API
✅ Login/logout

---

## New Additions

✨ About page (public + admin management)
✨ Team page (public + admin management)
✨ Gallery page (public + admin management with image uploads)
✨ Promotions page (public + admin management)
✨ Legal pages: Privacy, Terms, Consent
✨ Contact form with callback storage
✨ Pages visibility management
✨ SEO settings management
✨ Sitemap.xml generation
✨ Robots.txt generation
✨ Callback admin panel to view/delete submissions
✨ Mark callbacks as read/unread

---

## Usage Examples

### Creating a Callback (Frontend AJAX)
```javascript
fetch('/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Иван Петров',
    phone: '+7 (985) 123-45-67',
    service: 'Врачебная косметология',
    message: 'Интересует процедура'
  })
})
.then(r => r.json())
.then(data => console.log(data.message))
```

### Admin File Upload
```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);

fetch('/admin/upload', {
  method: 'POST',
  body: form
})
.then(r => r.json())
.then(data => console.log(data.url)) // '/uploads/1234567890-123456.jpg'
```

---

## Summary

**Total Routes**: 49
**Public Routes**: 13
**Admin Routes**: 36
**Authentication**: Session-based with bcrypt hashing
**Database**: JSON files
**Template Engine**: EJS
**Status**: Ready for production
