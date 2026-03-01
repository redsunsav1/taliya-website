# Code Snippets - Key Examples

## 1. Page Structure (All Pages)

```ejs
<% var pageTitle = 'Заголовок страницы'; %>
<%- include('../partials/header') %>

<main>
  <section class="section">
    <div class="container">
      <!-- Page content here -->
    </div>
  </section>
</main>

<%- include('../partials/footer') %>
```

## 2. Dynamic Team Members (team.ejs)

```ejs
<div class="team-grid fade-in">
  <% content.team.members.forEach(function(member) { %>
    <div class="team-card">
      <div class="team-card__photo">
        <img src="<%= member.photo %>" alt="<%= member.name %>" loading="lazy">
      </div>
      <div class="team-card__content">
        <h3 class="team-card__name"><%= member.name %></h3>
        <p class="team-card__role"><%= member.role %></p>
        <p class="team-card__experience">
          <i class="lucide" data-icon="briefcase"></i>
          Опыт работы: <%= member.experience %> лет
        </p>
      </div>
    </div>
  <% }); %>
</div>
```

## 3. Gallery with Filters (gallery.ejs)

```ejs
<div class="gallery-filters fade-in">
  <button class="filter-btn filter-btn--active" data-filter="all">Все</button>
  <% content.gallery.categories.forEach(function(category) { %>
    <button class="filter-btn" data-filter="<%= category.id %>">
      <%= category.name %>
    </button>
  <% }); %>
</div>

<div class="gallery-grid fade-in" id="gallery-grid">
  <% content.gallery.images.forEach(function(image) { %>
    <div class="gallery-item" data-category="<%= image.category %>">
      <img 
        src="<%= image.thumb %>" 
        alt="<%= image.title %>"
        data-full="<%= image.src %>"
        loading="lazy"
      >
    </div>
  <% }); %>
</div>
```

## 4. Promotions with Conditional Display (promotions.ejs)

```ejs
<% content.promotions.items.forEach(function(promo) { %>
  <% if (promo.active !== false) { %>
    <div class="promo-card">
      <div class="promo-card__badge">
        <span class="badge badge--<%= promo.badge.type %>">
          <%= promo.badge.text %>
        </span>
      </div>
      <h3 class="promo-card__title"><%= promo.title %></h3>
      <p class="promo-card__discount">
        Скидка: <span><%= promo.discount %></span>
      </p>
      <a href="https://profsalon.ru" class="btn btn--primary">
        Записаться
        <i class="lucide" data-icon="arrow-right"></i>
      </a>
    </div>
  <% } %>
<% }); %>
```

## 5. About Page with Values Grid (about.ejs)

```ejs
<div class="values-grid fade-in">
  <% content.about.values.forEach(function(value) { %>
    <div class="value-card">
      <div class="value-card__icon">
        <i class="lucide" data-icon="<%= value.icon %>"></i>
      </div>
      <h3 class="value-card__title"><%= value.title %></h3>
      <p class="value-card__description"><%= value.description %></p>
    </div>
  <% }); %>
</div>
```

## 6. Callback Form - HTML Structure (callback-form.ejs)

```ejs
<form id="callbackForm" class="callback-form" method="POST" action="/callback">
  <div class="form-group">
    <label for="callback-name" class="form-label">
      Ваше имя <span class="required">*</span>
    </label>
    <input 
      type="text" 
      id="callback-name" 
      name="name" 
      class="form-input" 
      required
      minlength="2"
    >
    <span class="form-error" id="error-name"></span>
  </div>

  <div class="form-group">
    <label for="callback-phone" class="form-label">
      Номер телефона <span class="required">*</span>
    </label>
    <input 
      type="tel" 
      id="callback-phone" 
      name="phone" 
      class="form-input" 
      required
      pattern="[0-9+\s\-\(\)]{10,}"
    >
  </div>

  <div class="form-group form-group--checkbox">
    <input type="checkbox" id="callback-consent" name="consent" required>
    <label for="callback-consent">
      Нажимая кнопку «Отправить», я даю согласие на обработку персональных данных
    </label>
  </div>

  <button type="submit" class="btn btn--primary">
    <i class="lucide" data-icon="send"></i>
    Отправить
  </button>
</form>
```

## 7. Callback Form - AJAX Submission (callback-form.ejs)

```javascript
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Очищаем предыдущие ошибки
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      successMessage.style.display = 'flex';
      form.reset();
      
      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);
    } else {
      // Обработка ошибок
      if (result.errors) {
        Object.keys(result.errors).forEach(field => {
          const errorElement = document.getElementById(`error-${field}`);
          if (errorElement) {
            errorElement.textContent = result.errors[field];
          }
        });
      }
      errorMessage.style.display = 'flex';
    }
  } catch (error) {
    console.error('Ошибка:', error);
    errorMessage.style.display = 'flex';
  }
});
```

## 8. Phone Input Masking (callback-form.ejs)

```javascript
const phoneInput = document.getElementById('callback-phone');

phoneInput.addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  
  if (value.length > 0) {
    if (value[0] !== '7' && value[0] !== '8') {
      value = '7' + value;
    }
    
    if (value.length > 1) {
      value = '+' + value[0] + ' (' + value.slice(1, 4);
    }
    if (value.length > 8) {
      value = value.slice(0, 8) + ') ' + value.slice(8, 11);
    }
    if (value.length > 12) {
      value = value.slice(0, 12) + '-' + value.slice(12, 14);
    }
    if (value.length > 15) {
      value = value.slice(0, 15) + '-' + value.slice(15, 17);
    }
    
    e.target.value = value;
  }
});
```

Format: +7 (XXX) XXX-XX-XX

## 9. Text Paragraph Splitting (about.ejs)

```ejs
<% if (content.about && content.about.text) { %>
  <% var paragraphs = content.about.text.split('\n'); %>
  <% paragraphs.forEach(function(para) { %>
    <% if (para.trim()) { %>
      <p class="text-block"><%= para.trim() %></p>
    <% } %>
  <% }); %>
<% } %>
```

Input: Text with `\n` line breaks
Output: Multiple `<p>` elements

## 10. Gallery Filter JavaScript (gallery.ejs)

```javascript
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const filter = this.getAttribute('data-filter');
    
    // Обновляем активную кнопку
    document.querySelectorAll('.filter-btn').forEach(b => 
      b.classList.remove('filter-btn--active')
    );
    this.classList.add('filter-btn--active');
    
    // Фильтруем изображения
    document.querySelectorAll('.gallery-item').forEach(item => {
      const category = item.getAttribute('data-category');
      if (filter === 'all' || category === filter) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
});
```

## 11. Russian Legal Text Example (privacy.ejs)

```ejs
<h2>1. Общие положения</h2>
<p>Общество с ограниченной ответственностью «МЕДИКА+» (далее - «Компания», «мы», 
«нас») уважает конфиденциальность ваших личных данных и обязуется защищать ваши 
персональные данные в соответствии с Федеральным законом от 27 июля 2006 года 
№ 152-ФЗ «О защите персональных данных» (далее - «Закон о защите персональных 
данных»).</p>

<h2>2. Информация, которую мы собираем</h2>
<ul>
  <li><strong>Идентификационные данные:</strong> ФИО, дата рождения</li>
  <li><strong>Контактная информация:</strong> номер телефона, электронный адрес</li>
  <li><strong>Данные о здоровье:</strong> информация о состоянии кожи, аллергиях</li>
</ul>
```

## 12. Conditional Content Rendering

```ejs
<!-- Показываем только если данные есть -->
<% if (content.team && content.team.members && 
       Array.isArray(content.team.members)) { %>
  <section class="section">
    <!-- Team member list -->
  </section>
<% } %>

<!-- Альтернативный текст если данных нет -->
<% if (content.about && content.about.license) { %>
  <p><%= content.about.license %></p>
<% } else { %>
  <p>Лицензия МЗ РФ</p>
<% } %>
```

## Expected Express.js Route

```javascript
// POST /callback
app.post('/callback', async (req, res) => {
  try {
    const { name, phone, email, service, message, consent, pageSource } = req.body;

    // Валидация
    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        errors: { name: 'Имя должно быть не менее 2 символов' }
      });
    }

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        errors: { phone: 'Некорректный номер телефона' }
      });
    }

    if (!consent) {
      return res.status(400).json({
        success: false,
        errors: { consent: 'Необходимо согласиться с политикой' }
      });
    }

    // Сохранение в БД
    await CallbackRequest.create({
      name, phone, email, service, message, pageSource
    });

    // Отправка почты
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Новая заявка с ${pageSource}`,
      text: `${name} - ${phone}`
    });

    return res.json({ success: true, message: 'Спасибо за обращение!' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});
```

