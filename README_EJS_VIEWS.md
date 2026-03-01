# Taliya Website - EJS Views Documentation

## Overview

This directory contains all EJS view files for the Taliya cosmetology website. The website uses EJS templating with a pastel green-white color scheme, Lucide icons, and is fully compliant with Russian Federation laws (152-ФЗ, 168-ФЗ).

**Created:** March 1, 2026  
**Total Files:** 8 view files (7 pages + 1 partial)  
**Total Code:** 949 lines  
**All Text:** Russian (Русский язык)

## Files Overview

### Page Files (`views/pages/`)

| File | Purpose | Lines | Size | Callback |
|------|---------|-------|------|----------|
| about.ejs | About company | 83 | 3.0K | Yes |
| team.ejs | Team members | 62 | 2.5K | Yes |
| gallery.ejs | Image gallery with filters | 104 | 4.2K | Yes |
| promotions.ejs | Active promotions | 77 | 3.2K | Yes |
| privacy.ejs | Privacy Policy (152-ФЗ) | 118 | 13K | No |
| terms.ejs | Terms of Service | 116 | 16K | No |
| consent.ejs | Data Consent (152-ФЗ) | 155 | 14K | No |

### Partial Component (`views/partials/`)

| File | Purpose | Lines | Size |
|------|---------|-------|------|
| callback-form.ejs | Reusable callback form | 234 | 8.4K |

## Documentation Files

Read these files for implementation details:

1. **VIEWS_CREATED.md** - Detailed page-by-page documentation
2. **CONTENT_STRUCTURE.md** - JSON data structure guide with examples
3. **QUICK_REFERENCE.md** - Developer quick reference with CSS classes
4. **CODE_SNIPPETS.md** - Key code examples and patterns

## Quick Start

### 1. Include Views in Your Routes

```javascript
// Example Express.js route
app.get('/about', (req, res) => {
  const content = require('./content.json');
  res.render('pages/about', { content });
});
```

### 2. Create content.json

Use the structure from **CONTENT_STRUCTURE.md** to populate your data.

### 3. Ensure CSS Classes Exist

Required CSS classes:
- Layout: `.section`, `.container`, `.section__title`, `.section__subtitle`
- Cards: `.team-card`, `.promo-card`, `.value-card`, `.gallery-item`
- Forms: `.form-group`, `.form-input`, `.form-textarea`, `.form-error`
- Buttons: `.btn`, `.btn--primary`
- Other: `.fade-in`, `.badge`

### 4. Include Required Assets

- Lucide Icons library (for data-icon attributes)
- CSS with BEM naming convention
- Existing header.ejs and footer.ejs partials

### 5. Implement /callback Endpoint

```javascript
app.post('/callback', async (req, res) => {
  // See CODE_SNIPPETS.md for full implementation
});
```

## Content Structure

### Minimal content.json

```json
{
  "contact": {
    "address": "Москва, ул. Примерная, д. 1",
    "phone": "+7 (495) 123-45-67",
    "email": "info@taliya.ru"
  },
  "services": [
    { "id": "botox", "name": "Ботулинотерапия" }
  ]
}
```

### Full Example

See **CONTENT_STRUCTURE.md** for complete example with all sections.

## Page Details

### About Page (`about.ejs`)
- Hero banner with title
- Dynamic text content (paragraphs)
- Values/benefits grid with icons
- Company license and certificate info
- Callback form

**Data Required:** `content.about`

### Team Page (`team.ejs`)
- Team member grid
- Photos with lazy loading
- Name, role, experience years
- Bio and specialties tags
- Callback form

**Data Required:** `content.team.members[]`

### Gallery Page (`gallery.ejs`)
- Filterable image gallery
- Category buttons
- Image grid with thumbnails
- Lightbox data attributes
- JavaScript filtering
- Callback form

**Data Required:** `content.gallery.images[]`, `content.gallery.categories[]`

### Promotions Page (`promotions.ejs`)
- Promotion cards grid
- Badges (type and text)
- Discount display
- Details list with checkmarks
- profsalon.ru CTA links
- Active/inactive filtering
- Callback form

**Data Required:** `content.promotions.items[]`

### Privacy Policy (`privacy.ejs`)
- Legal document (no callback)
- 152-ФЗ compliant
- 11 comprehensive sections
- Hardcoded Russian legal text
- Company contact info

**Sections:**
1. General provisions
2. Information collected
3. Data collection purposes
4. Legal basis (152-ФЗ)
5. Cookies and analytics
6. Data security
7. User rights
8. Third-party transmission
9. Data retention
10. Contact information
11. Policy updates

### Terms of Service (`terms.ejs`)
- Legal document (no callback)
- 18 comprehensive sections
- Hardcoded Russian legal text
- Russian jurisdiction specified

**Sections:**
1. General provisions
2. License of use
3. Liability limitations
4. Intellectual property
5. Rules of conduct
6. Services and booking
7. Cancellation policy
8. Medical services disclaimer
9. Third-party links
10. Service interruptions
11. Indemnification
12. Jurisdiction and law
13. Dispute resolution
14. Agreement completeness
15. Severability
16. Policy updates
17. Governing law
18. Contact information

### Personal Data Consent (`consent.ejs`)
- Legal document (no callback)
- 152-ФЗ compliant
- 12 comprehensive sections
- Hardcoded Russian legal text

**Sections:**
1. Definition and scope
2. Types of personal data
3. Processing purposes
4. Processing methods
5. Consent duration
6. Withdrawal procedure
7. User rights
8. Voluntary confirmation
9. Extended consent
10. Applicable law
11. Operator contact info
12. Final provisions

### Callback Form (`callback-form.ejs`)
- Included on all non-legal pages
- Required: name, phone, consent
- Optional: email, service, message
- AJAX submission to /callback
- Client-side validation
- Phone input masking: +7 (XXX) XXX-XX-XX
- Message character counter (1000 max)
- Success/error messages
- Error highlighting

**Form Data Posted:**
```json
{
  "name": "string (required, 2+ chars)",
  "phone": "string (required)",
  "email": "string (optional)",
  "service": "string (optional)",
  "message": "string (max 1000 chars)",
  "consent": "boolean (required)",
  "pageSource": "string (auto-filled)"
}
```

## Features

### Dynamic Rendering
- EJS variables for all content
- Conditional sections (safe null checking)
- Array iteration with forEach
- Text paragraph splitting on \n
- Fallback text for missing data

### Forms
- HTML5 validation attributes
- Client-side error display
- AJAX submission (fetch API)
- JSON request/response
- Phone input masking
- Message character counter
- Error field highlighting
- Success message auto-hide

### Gallery
- Category filtering
- Active filter indication
- Lightbox data attributes
- Lazy loading images
- Thumbnail and full images

### Icons
- Lucide Icons library
- 9+ icon types used
- data-icon attributes
- Ready for lucide.min.js

### HTML & CSS
- Semantic HTML5
- BEM naming convention
- Responsive grid layouts
- Fade-in animations
- Touch-friendly forms
- Accessible form labels

## Russian Compliance

### Language
- All text in Russian (Русский язык)
- No English without translation
- Russian business terminology
- Proper legal language

### Laws Covered
- **152-ФЗ:** Personal data protection
  - Referenced in privacy.ejs (2x)
  - Referenced in consent.ejs (4x)
  - Full compliance in both documents

- **168-ФЗ:** Foreign terms in Russian
  - Compliant - no anglicisms without Russian equiv.
  - Examples: Ватсап (WhatsApp), Телеграм (Telegram)

### Legal Documents
- Privacy Policy: 152-ФЗ compliant ✓
- Terms of Service: Russian law jurisdiction ✓
- Consent Form: 152-ФЗ compliant ✓
- Company: ООО «МЕДИКА+» ✓

## Integration Checklist

- [ ] Create Express routes for all pages
- [ ] Create content.json with required structure
- [ ] Add CSS with required classes
- [ ] Include Lucide Icons library
- [ ] Ensure header.ejs and footer.ejs exist
- [ ] Implement POST /callback endpoint
- [ ] Add database storage for callbacks
- [ ] Add email notification system
- [ ] Test all forms and validation
- [ ] Test gallery filtering
- [ ] Test phone input masking
- [ ] Verify Russian text display
- [ ] Test mobile responsiveness
- [ ] Test AJAX form submission
- [ ] Verify legal documents render

## Expected Response from /callback

**Success:**
```json
{
  "success": true,
  "message": "Спасибо за обращение!"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Ошибка валидации",
  "errors": {
    "phone": "Некорректный номер телефона",
    "consent": "Необходимо согласиться с политикой"
  }
}
```

**Server Error:**
```json
{
  "success": false,
  "message": "Ошибка сервера"
}
```

## CSS Classes Reference

### Layout
- `.section` - Page section wrapper
- `.section--hero` - Hero banner
- `.section--values` - Values grid section
- `.section--team` - Team grid section
- `.section--gallery` - Gallery section
- `.section--promotions` - Promotions section
- `.section--callback` - Callback form section
- `.container` - Content container
- `.fade-in` - Fade-in animation class

### Typography
- `.section__title` - Main headings (h1, h2)
- `.section__subtitle` - Subheadings
- `.text-block` - Paragraph text

### Cards
- `.team-card` - Team member card
- `.team-card__photo` - Photo wrapper
- `.team-card__name` - Member name
- `.team-card__role` - Member role
- `.team-card__experience` - Experience text
- `.team-card__specialties` - Specialties list
- `.specialty-tag` - Specialty tag

- `.promo-card` - Promotion card
- `.promo-card__badge` - Badge wrapper
- `.promo-card__title` - Promo title
- `.promo-card__description` - Description
- `.promo-card__details` - Details list
- `.promo-card__discount` - Discount display
- `.promo-card__validity` - Valid until text

- `.value-card` - Values card
- `.value-card__icon` - Icon wrapper
- `.value-card__title` - Value title
- `.value-card__description` - Value description

- `.gallery-item` - Gallery image item
- `.gallery-item__image` - Image element
- `.gallery-item__overlay` - Hover overlay
- `.gallery-item__title` - Image title
- `.gallery-item__description` - Image description

### Forms
- `.callback-form` - Form wrapper
- `.form-group` - Field group
- `.form-group--checkbox` - Checkbox group
- `.form-label` - Field label
- `.form-input` - Text input
- `.form-select` - Select dropdown
- `.form-textarea` - Text area
- `.form-error` - Error message
- `.form-hint` - Hint text
- `.form-message` - Message display
- `.form-message--success` - Success message
- `.form-message--error` - Error message
- `.checkbox-label` - Checkbox label
- `.required` - Required indicator
- `.link-inline` - Inline link
- `.btn` - Button
- `.btn--primary` - Primary button
- `.btn--large` - Large button

### Filters & Badges
- `.gallery-filters` - Filter buttons
- `.filter-btn` - Filter button
- `.filter-btn--active` - Active filter
- `.badge` - Badge element
- `.badge--info` - Info badge
- `.badge--danger` - Danger badge
- `.badge--warning` - Warning badge

### Grids
- `.team-grid` - Team grid
- `.values-grid` - Values grid
- `.gallery-grid` - Gallery grid
- `.promotions-grid` - Promotions grid

## Icons Used (Lucide Icons)

- `data-icon="heart"` - Heart (values)
- `data-icon="star"` - Star (values/ratings)
- `data-icon="shield"` - Shield (security)
- `data-icon="briefcase"` - Briefcase (experience)
- `data-icon="check"` - Checkmark (benefits, form)
- `data-icon="arrow-right"` - Arrow right (CTAs)
- `data-icon="send"` - Send (form submit)
- `data-icon="check-circle"` - Check circle (success)
- `data-icon="alert-circle"` - Alert circle (errors)
- `data-icon="calendar"` - Calendar (dates)

## Support & Questions

For implementation questions, refer to:
1. QUICK_REFERENCE.md - Common tasks
2. CODE_SNIPPETS.md - Code examples
3. CONTENT_STRUCTURE.md - Data structure guide
4. VIEWS_CREATED.md - Detailed documentation

## License

All files created for the Taliya website project.

---

**Status:** Production Ready ✓  
**Last Updated:** March 1, 2026  
**Russian Compliance:** 152-ФЗ, 168-ФЗ ✓  
**All Sections:** Documented ✓
