const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (Timeweb Cloud, nginx)
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'taliya-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production' ? false : false,
    sameSite: 'lax'
  }
}));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

// Helper: load/save data
function loadContent() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data/content.json'), 'utf8'));
  } catch (e) {
    return {
      site: {},
      hero: {},
      benefits: [],
      services: [],
      pages: {
        about: { visible: true },
        team: { visible: true },
        gallery: { visible: true },
        promotions: { visible: true },
        privacy: { visible: true },
        terms: { visible: true },
        consent: { visible: true }
      },
      about: { title: '', content: '' },
      team: { title: '', members: [] },
      gallery: { title: '', images: [] },
      promotions: { title: '', items: [] },
      legal: {
        privacy: '',
        terms: '',
        consent: ''
      },
      seo: {
        title: 'Талия',
        description: 'Центр эстетики тела и косметологии'
      }
    };
  }
}

function saveContent(data) {
  fs.writeFileSync(path.join(__dirname, 'data/content.json'), JSON.stringify(data, null, 2), 'utf8');
}

function loadAdmin() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data/admin.json'), 'utf8'));
  } catch (e) {
    return { username: 'admin', password: 'placeholder' };
  }
}

function saveAdmin(data) {
  fs.writeFileSync(path.join(__dirname, 'data/admin.json'), JSON.stringify(data, null, 2), 'utf8');
}

function loadCallbacks() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data/callbacks.json'), 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveCallbacks(data) {
  fs.writeFileSync(path.join(__dirname, 'data/callbacks.json'), JSON.stringify(data, null, 2), 'utf8');
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/admin/login');
}

// Make content available to all views
app.use((req, res, next) => {
  res.locals.content = loadContent();
  res.locals.currentPath = req.path;
  next();
});

// ===== PUBLIC ROUTES =====

app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/contacts', (req, res) => {
  res.render('pages/contacts');
});

// Service pages
app.get('/service/:slug', (req, res) => {
  const content = loadContent();
  const service = content.services.find(s => s.slug === req.params.slug);
  if (!service) return res.status(404).render('pages/404');
  res.render('pages/service', { service });
});

// About page
app.get('/about', (req, res) => {
  const content = loadContent();
  res.render('pages/about', { about: content.about });
});

// Team page
app.get('/team', (req, res) => {
  const content = loadContent();
  res.render('pages/team', { team: content.team });
});

// Gallery page
app.get('/gallery', (req, res) => {
  const content = loadContent();
  res.render('pages/gallery', { gallery: content.gallery });
});

// Promotions page
app.get('/promotions', (req, res) => {
  const content = loadContent();
  res.render('pages/promotions', { promotions: content.promotions });
});

// Legal pages
app.get('/privacy', (req, res) => {
  const content = loadContent();
  res.render('pages/privacy', { content: content.legal.privacy });
});

app.get('/terms', (req, res) => {
  const content = loadContent();
  res.render('pages/terms', { content: content.legal.terms });
});

app.get('/consent', (req, res) => {
  const content = loadContent();
  res.render('pages/consent', { content: content.legal.consent });
});

// Callback form submission
app.post('/callback', (req, res) => {
  try {
    const { name, phone, service, message } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Имя и телефон обязательны' });
    }

    const callbacks = loadCallbacks();
    const newCallback = {
      id: Date.now().toString(),
      name,
      phone,
      service: service || '',
      message: message || '',
      submittedAt: new Date().toISOString(),
      read: false
    };

    callbacks.push(newCallback);
    saveCallbacks(callbacks);
    
    res.json({ success: true, message: 'Заявка принята' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Ошибка при отправке заявки' });
  }
});

// Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const content = loadContent();
  const domain = `${req.protocol}://${req.get('host')}`;
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/contacts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/team</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/gallery</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/promotions</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${domain}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${domain}/consent</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;

  // Add services
  if (content.services && Array.isArray(content.services)) {
    content.services.forEach(service => {
      sitemap += `\n  <url>
    <loc>${domain}/service/${service.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  }

  sitemap += '\n</urlset>';
  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`;
  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

// ===== ADMIN ROUTES =====

app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  const admin = loadAdmin();
  const { username, password } = req.body;

  if (username === admin.username && await bcrypt.compare(password, admin.password)) {
    req.session.authenticated = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Неверный логин или пароль' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin', requireAuth, (req, res) => {
  res.render('admin/dashboard');
});

// ===== SETTINGS =====

app.get('/admin/settings', requireAuth, (req, res) => {
  res.render('admin/settings');
});

app.post('/admin/settings', requireAuth, (req, res) => {
  const content = loadContent();
  const fields = ['name', 'tagline', 'phone', 'phoneRaw', 'address', 'hours', 'email', 'vk', 'telegram', 'whatsapp', 'profsalon', 'license', 'company', 'mapEmbed', 'profsalonWidget'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) content.site[f] = req.body[f];
  });
  saveContent(content);
  res.redirect('/admin/settings?saved=1');
});

// ===== HERO =====

app.get('/admin/hero', requireAuth, (req, res) => {
  res.render('admin/hero');
});

app.post('/admin/hero', requireAuth, upload.single('image'), (req, res) => {
  const content = loadContent();
  content.hero.title = req.body.title || content.hero.title;
  content.hero.subtitle = req.body.subtitle || content.hero.subtitle;
  content.hero.promoText = req.body.promoText || content.hero.promoText;
  content.hero.promoNote = req.body.promoNote || content.hero.promoNote;
  if (req.file) content.hero.image = '/uploads/' + req.file.filename;
  saveContent(content);
  res.redirect('/admin/hero?saved=1');
});

// ===== BENEFITS =====

app.get('/admin/benefits', requireAuth, (req, res) => {
  res.render('admin/benefits');
});

app.post('/admin/benefits', requireAuth, (req, res) => {
  const content = loadContent();
  const { icons, titles, texts } = req.body;
  if (Array.isArray(titles)) {
    content.benefits = titles.map((title, i) => ({
      icon: icons[i] || '',
      title: title || '',
      text: texts[i] || ''
    }));
  }
  saveContent(content);
  res.redirect('/admin/benefits?saved=1');
});

// ===== SERVICES =====

app.get('/admin/services', requireAuth, (req, res) => {
  res.render('admin/services');
});

app.get('/admin/services/:slug', requireAuth, (req, res) => {
  const content = loadContent();
  const service = content.services.find(s => s.slug === req.params.slug);
  if (!service) return res.redirect('/admin/services');
  res.render('admin/service-edit', { service });
});

app.post('/admin/services/:slug', requireAuth, upload.single('image'), (req, res) => {
  const content = loadContent();
  const idx = content.services.findIndex(s => s.slug === req.params.slug);
  if (idx === -1) return res.redirect('/admin/services');

  const service = content.services[idx];
  service.name = req.body.name || service.name;
  service.shortName = req.body.shortName || service.shortName;
  service.description = req.body.description || service.description;
  service.discount = req.body.discount || service.discount;
  if (req.file) service.image = '/uploads/' + req.file.filename;

  // Update items
  if (req.body.itemNames) {
    const names = Array.isArray(req.body.itemNames) ? req.body.itemNames : [req.body.itemNames];
    const descs = Array.isArray(req.body.itemDescs) ? req.body.itemDescs : [req.body.itemDescs];
    const durations = Array.isArray(req.body.itemDurations) ? req.body.itemDurations : [req.body.itemDurations];
    const prices = Array.isArray(req.body.itemPrices) ? req.body.itemPrices : [req.body.itemPrices];
    const p5 = Array.isArray(req.body.itemP5) ? req.body.itemP5 : [req.body.itemP5];
    const p10 = Array.isArray(req.body.itemP10) ? req.body.itemP10 : [req.body.itemP10];
    const cats = Array.isArray(req.body.itemCats) ? req.body.itemCats : [req.body.itemCats || ''];

    service.items = names.map((name, i) => ({
      name: name || '',
      category: cats[i] || '',
      description: descs[i] || '',
      duration: durations[i] || '',
      price: prices[i] || '',
      pricePackage5: (p5[i] || ''),
      pricePackage10: (p10[i] || '')
    })).filter(item => item.name.trim());
  } else {
    service.items = [];
  }

  // Update advantages
  if (req.body.advTitles) {
    const aIcons = Array.isArray(req.body.advIcons) ? req.body.advIcons : [req.body.advIcons];
    const aTitles = Array.isArray(req.body.advTitles) ? req.body.advTitles : [req.body.advTitles];
    const aTexts = Array.isArray(req.body.advTexts) ? req.body.advTexts : [req.body.advTexts];

    service.advantages = aTitles.map((title, i) => ({
      icon: aIcons[i] || 'star',
      title: title || '',
      text: aTexts[i] || ''
    })).filter(a => a.title.trim());
  } else {
    service.advantages = [];
  }

  // Update doctors
  if (req.body.docNames) {
    const dNames = Array.isArray(req.body.docNames) ? req.body.docNames : [req.body.docNames];
    const dRoles = Array.isArray(req.body.docRoles) ? req.body.docRoles : [req.body.docRoles];
    const dExps = Array.isArray(req.body.docExps) ? req.body.docExps : [req.body.docExps];
    const dPhotos = Array.isArray(req.body.docPhotos) ? req.body.docPhotos : [req.body.docPhotos];
    const dBios = Array.isArray(req.body.docBios) ? req.body.docBios : [req.body.docBios];

    service.doctors = dNames.map((name, i) => ({
      name: name || '',
      role: dRoles[i] || '',
      experience: dExps[i] || '',
      photo: dPhotos[i] || '/images/doctors/default.svg',
      bio: dBios[i] || ''
    })).filter(d => d.name.trim());
  } else {
    service.doctors = [];
  }

  content.services[idx] = service;
  saveContent(content);
  res.redirect('/admin/services/' + req.params.slug + '?saved=1');
});

app.post('/admin/services-add', requireAuth, (req, res) => {
  const content = loadContent();
  const slug = req.body.slug || 'new-service-' + Date.now();
  content.services.push({
    id: slug,
    slug,
    name: req.body.name || 'Новая услуга',
    shortName: req.body.shortName || 'Новая услуга',
    description: req.body.description || '',
    image: '/images/services/default.jpg',
    icon: 'star',
    discount: '',
    items: [],
    advantages: [],
    doctors: []
  });
  saveContent(content);
  res.redirect('/admin/services/' + slug);
});

app.post('/admin/services/:slug/delete', requireAuth, (req, res) => {
  const content = loadContent();
  content.services = content.services.filter(s => s.slug !== req.params.slug);
  saveContent(content);
  res.redirect('/admin/services');
});

app.post('/admin/services-reorder', requireAuth, express.json(), (req, res) => {
  const content = loadContent();
  const { slug, direction } = req.body;
  const idx = content.services.findIndex(s => s.slug === slug);
  if (idx === -1) return res.json({ ok: false });

  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= content.services.length) return res.json({ ok: false });

  // Swap
  [content.services[idx], content.services[newIdx]] = [content.services[newIdx], content.services[idx]];
  saveContent(content);
  res.json({ ok: true });
});

// ===== ABOUT PAGE =====

app.get('/admin/about', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/about', { about: content.about || { title: '', content: '' } });
});

app.post('/admin/about', requireAuth, (req, res) => {
  const content = loadContent();
  content.about = {
    title: req.body.title || '',
    content: req.body.content || ''
  };
  saveContent(content);
  res.redirect('/admin/about?saved=1');
});

// ===== TEAM PAGE =====

app.get('/admin/team', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/team', { team: content.team || { title: '', members: [] } });
});

app.post('/admin/team', requireAuth, (req, res) => {
  const content = loadContent();
  const { names, roles, bios, photos } = req.body;
  
  let members = [];
  if (Array.isArray(names)) {
    members = names.map((name, i) => ({
      name: name || '',
      role: (Array.isArray(roles) ? roles[i] : roles) || '',
      bio: (Array.isArray(bios) ? bios[i] : bios) || '',
      photo: (Array.isArray(photos) ? photos[i] : photos) || '/images/team/default.svg'
    })).filter(m => m.name.trim());
  }

  content.team = {
    title: req.body.title || '',
    members
  };
  saveContent(content);
  res.redirect('/admin/team?saved=1');
});

// ===== GALLERY PAGE =====

app.get('/admin/gallery', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/gallery', { gallery: content.gallery || { title: '', images: [] } });
});

app.post('/admin/gallery', requireAuth, upload.array('images', 20), (req, res) => {
  const content = loadContent();
  let images = content.gallery?.images || [];

  // Add new uploads
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      images.push({
        url: '/uploads/' + file.filename,
        caption: ''
      });
    });
  }

  // Update captions if provided
  if (req.body.captions) {
    const captions = Array.isArray(req.body.captions) ? req.body.captions : [req.body.captions];
    images = images.map((img, i) => ({
      ...img,
      caption: captions[i] || img.caption || ''
    }));
  }

  content.gallery = {
    title: req.body.title || '',
    images
  };
  saveContent(content);
  res.redirect('/admin/gallery?saved=1');
});

// ===== PROMOTIONS PAGE =====

app.get('/admin/promotions', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/promotions', { promotions: content.promotions || { title: '', items: [] } });
});

app.post('/admin/promotions', requireAuth, (req, res) => {
  const content = loadContent();
  const { titles, descriptions, codes, discounts } = req.body;
  
  let items = [];
  if (Array.isArray(titles)) {
    items = titles.map((title, i) => ({
      title: title || '',
      description: (Array.isArray(descriptions) ? descriptions[i] : descriptions) || '',
      code: (Array.isArray(codes) ? codes[i] : codes) || '',
      discount: (Array.isArray(discounts) ? discounts[i] : discounts) || ''
    })).filter(item => item.title.trim());
  }

  content.promotions = {
    title: req.body.promoTitle || '',
    items
  };
  saveContent(content);
  res.redirect('/admin/promotions?saved=1');
});

// ===== LEGAL PAGES =====

app.get('/admin/legal', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/legal', { 
    legal: content.legal || {
      privacy: '',
      terms: '',
      consent: ''
    }
  });
});

app.post('/admin/legal', requireAuth, (req, res) => {
  const content = loadContent();
  if (!content.legal) content.legal = {};
  
  content.legal.privacy = req.body.privacy || '';
  content.legal.terms = req.body.terms || '';
  content.legal.consent = req.body.consent || '';
  
  saveContent(content);
  res.redirect('/admin/legal?saved=1');
});

// ===== SEO SETTINGS =====

app.get('/admin/seo', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/seo', { 
    seo: content.seo || {
      title: 'Талия',
      description: 'Центр эстетики тела и косметологии'
    }
  });
});

app.post('/admin/seo', requireAuth, (req, res) => {
  const content = loadContent();
  if (!content.seo) content.seo = {};
  
  content.seo.title = req.body.title || '';
  content.seo.description = req.body.description || '';
  content.seo.keywords = req.body.keywords || '';
  content.seo.canonical = req.body.canonical || '';
  
  saveContent(content);
  res.redirect('/admin/seo?saved=1');
});

// ===== PAGES VISIBILITY =====

app.get('/admin/pages', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/pages', { 
    pages: content.pages || {
      about: { visible: true },
      team: { visible: true },
      gallery: { visible: true },
      promotions: { visible: true },
      privacy: { visible: true },
      terms: { visible: true },
      consent: { visible: true }
    }
  });
});

app.post('/admin/pages', requireAuth, (req, res) => {
  const content = loadContent();
  if (!content.pages) content.pages = {};
  
  const pageNames = ['about', 'team', 'gallery', 'promotions', 'privacy', 'terms', 'consent'];
  pageNames.forEach(page => {
    if (!content.pages[page]) content.pages[page] = {};
    content.pages[page].visible = req.body[page] === 'on' || req.body[page] === 'true';
  });
  
  saveContent(content);
  res.redirect('/admin/pages?saved=1');
});

// ===== CALLBACKS =====

app.get('/admin/callbacks', requireAuth, (req, res) => {
  const callbacks = loadCallbacks();
  // Sort by date, newest first
  callbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.render('admin/callbacks', { callbacks });
});

app.post('/admin/callbacks/:id/delete', requireAuth, (req, res) => {
  const callbacks = loadCallbacks();
  const filtered = callbacks.filter(c => c.id !== req.params.id);
  saveCallbacks(filtered);
  res.redirect('/admin/callbacks?deleted=1');
});

app.post('/admin/callbacks/:id/read', requireAuth, (req, res) => {
  const callbacks = loadCallbacks();
  const callback = callbacks.find(c => c.id === req.params.id);
  if (callback) {
    callback.read = !callback.read;
    saveCallbacks(callbacks);
  }
  res.redirect('/admin/callbacks');
});

// ===== PASSWORD =====

app.get('/admin/password', requireAuth, (req, res) => {
  res.render('admin/password', { error: null, success: false });
});

app.post('/admin/password', requireAuth, async (req, res) => {
  const admin = loadAdmin();
  const { current, newpass, confirm } = req.body;

  if (!await bcrypt.compare(current, admin.password)) {
    return res.render('admin/password', { error: 'Неверный текущий пароль', success: false });
  }
  if (newpass !== confirm) {
    return res.render('admin/password', { error: 'Пароли не совпадают', success: false });
  }
  if (newpass.length < 6) {
    return res.render('admin/password', { error: 'Пароль должен быть не менее 6 символов', success: false });
  }

  admin.password = await bcrypt.hash(newpass, 10);
  saveAdmin(admin);
  res.render('admin/password', { error: null, success: true });
});

// ===== FILE UPLOAD API =====

app.post('/admin/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ===== 404 =====

app.use((req, res) => {
  res.status(404).render('pages/404');
});

// Initialize admin password if placeholder
(async () => {
  const admin = loadAdmin();
  if (admin.password.includes('placeholder')) {
    admin.password = await bcrypt.hash('admin123', 10);
    saveAdmin(admin);
    console.log('Admin password initialized. Login: admin / admin123');
  }
})();

app.listen(PORT, () => {
  console.log(`Сервер «Талия» запущен: http://localhost:${PORT}`);
});
