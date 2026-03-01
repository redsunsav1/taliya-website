# Quick Reference Guide - Taliya Website EJS Views

## File Locations
```
/sessions/sharp-amazing-cori/mnt/taliya-website/
├── views/
│   ├── pages/
│   │   ├── about.ejs         - About page
│   │   ├── team.ejs          - Team members page
│   │   ├── gallery.ejs       - Gallery with filters
│   │   ├── promotions.ejs    - Active promotions
│   │   ├── privacy.ejs       - Privacy policy (152-ФЗ)
│   │   ├── terms.ejs         - Terms of service
│   │   └── consent.ejs       - Consent form (152-ФЗ)
│   └── partials/
│       └── callback-form.ejs - Reusable callback form
```

## How Each Page Works

### About Page (about.ejs)
- Displays company information
- Shows values/benefits with icons
- Uses: content.about.text, content.about.values, content.about.license
- Includes callback form

### Team Page (team.ejs)
- Lists all team members
- Shows: photo, name, role, experience, bio, specialties
- Uses: content.team.members[]
- Includes callback form

### Gallery Page (gallery.ejs)
- Filterable image gallery
- Categories: content.gallery.categories[]
- Images: content.gallery.images[]
- Includes lightbox hooks
- Includes callback form

### Promotions Page (promotions.ejs)
- Shows only active promotions (active !== false)
- Each has: badge, title, discount, details
- CTA button links to profsalon.ru
- Uses: content.promotions.items[]
- Includes callback form

### Legal Pages (privacy.ejs, terms.ejs, consent.ejs)
- Full Russian legal documents
- No callback form (legal docs don't need it)
- No dynamic content - hardcoded legal text
- Contact info from: content.contact.*

## Callback Form Features

### Fields
- Name (required, 2+ chars)
- Phone (required, +7 format)
- Email (optional)
- Service (optional dropdown)
- Message (optional, 1000 char limit)
- Consent checkbox (required)

### JavaScript Features
- Phone input mask: +7 (XXX) XXX-XX-XX
- Character counter for message
- AJAX form submission
- Client-side validation
- Error display below fields
- Success/error messages at top

### Form Behavior
- Posts to: /callback endpoint
- Method: POST with JSON body
- Hidden field: pageSource (auto-filled)
- Success: message hides after 5 seconds
- Errors: displayed inline and at top

## CSS Classes Used

### Layout
- `.section` - Page section
- `.container` - Content wrapper
- `.fade-in` - Animation class

### Typography
- `.section__title` - Main headings
- `.section__subtitle` - Subheadings
- `.text-block` - Paragraph text

### Cards
- `.team-card` - Team member card
- `.promo-card` - Promotion card
- `.value-card` - Values/benefits card
- `.gallery-item` - Gallery image

### Forms
- `.form-group` - Form field wrapper
- `.form-label` - Field label
- `.form-input` - Text input
- `.form-textarea` - Text area
- `.form-error` - Error message
- `.required` - Required field indicator

## Icons Used (Lucide Icons)

```
data-icon="heart"           - Heart icon
data-icon="star"            - Star icon
data-icon="check"           - Checkmark
data-icon="arrow-right"     - Arrow right
data-icon="briefcase"       - Briefcase (experience)
data-icon="send"            - Send (submit)
data-icon="check-circle"    - Success indicator
data-icon="alert-circle"    - Error indicator
data-icon="calendar"        - Calendar (dates)
```

## Data Binding Examples

### Conditional Rendering
```ejs
<% if (content.about && content.about.values) { %>
  <!-- Render values -->
<% } %>
```

### Array Iteration
```ejs
<% content.team.members.forEach(function(member) { %>
  <!-- Render member card -->
<% }); %>
```

### Dynamic Content
```ejs
<%= content.team.title %>
<%= member.name %>
<%= promo.discount %>
```

### Line Break Splitting
```ejs
<% var paragraphs = content.about.text.split('\n'); %>
<% paragraphs.forEach(function(para) { %>
  <p><%= para.trim() %></p>
<% }); %>
```

## Common Tasks

### Add New Team Member
Edit content.json:
```json
{
  "name": "Имя Фамилия",
  "role": "Должность",
  "experience": 10,
  "bio": "Описание",
  "photo": "/images/team/photo.jpg",
  "specialties": ["Специальность 1", "Специальность 2"]
}
```

### Add Gallery Image
Edit content.json:
```json
{
  "src": "/images/full-image.jpg",
  "thumb": "/images/thumb-image.jpg",
  "title": "Название",
  "description": "Описание",
  "category": "face"
}
```

### Add Promotion
Edit content.json:
```json
{
  "active": true,
  "badge": { "type": "danger", "text": "Текст" },
  "title": "Название",
  "description": "Описание",
  "details": ["Деталь 1", "Деталь 2"],
  "discount": "-30%",
  "validUntil": "31.03.2026"
}
```

### Hide Promotion
Set `active: false` in content.json

### Change Service List
Edit content.services[] in content.json

## Form Validation

### Client-Side
- Name: required, min 2 chars
- Phone: required, pattern match
- Email: optional, email validation
- Consent: required checkbox

### Server-Side
Expected endpoint: POST /callback
Expected response:
```json
{
  "success": true,
  "message": "Спасибо!"
}
```

On error:
```json
{
  "success": false,
  "message": "Ошибка",
  "errors": {
    "phone": "Некорректный номер"
  }
}
```

## Russian Compliance

All documents include:
- 152-ФЗ references (data protection law)
- Russian legal terminology
- No English terms without translations
- ООО «МЕДИКА+» as company name
- Russian contact information

## Notes

1. All pages automatically include header and footer partials
2. All pages set pageTitle variable for browser tab
3. Fallback text shown if content.* missing
4. Callback form can be included on any page
5. Legal documents are hardcoded (no dynamic content)
6. Gallery filters require client-side JavaScript
7. Phone field has automatic formatting
8. All forms validate before submission

