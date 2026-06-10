const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (Timeweb Cloud, nginx)
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Legacy v2 preview URLs are no longer canonical. Keep old links from opening
// a different design by routing them to the live EJS pages.
const legacyPreviewRedirects = {
  '/home-v2.html': '/',
  '/about-v2.html': '/about',
  '/service-v2.html': '/service/vrachebnaya-kosmetologiya',
  '/team-v2.html': '/team',
  '/gallery-v2.html': '/gallery',
  '/promotions-v2.html': '/promotions',
  '/contacts-v2.html': '/contacts'
};

app.use((req, res, next) => {
  const target = legacyPreviewRedirects[req.path];
  if (target) return res.redirect(301, target);
  next();
});

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

// Post-upload image optimization: resize big images (>1920px) and recompress.
// Skips SVG (vector) and GIF (may be animated).
async function optimizeFile(file) {
  if (!file || !file.path) return;
  const ext = path.extname(file.path).toLowerCase();
  if (ext === '.svg' || ext === '.gif') return;
  try {
    const img = sharp(file.path, { failOn: 'none' });
    const meta = await img.metadata();
    const MAX_W = 1920;
    const needsResize = meta.width && meta.width > MAX_W;
    let pipeline = img.rotate(); // respect EXIF orientation
    if (needsResize) pipeline = pipeline.resize({ width: MAX_W, withoutEnlargement: true });

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 82 });
    } else {
      return;
    }

    const tmp = file.path + '.tmp';
    await pipeline.toFile(tmp);
    fs.renameSync(tmp, file.path);
  } catch (err) {
    console.error('optimizeFile failed for', file.path, err.message);
  }
}

// Express middleware: runs after multer and optimizes req.file / req.files
function optimizeUploads(req, res, next) {
  const tasks = [];
  if (req.file) tasks.push(optimizeFile(req.file));
  if (Array.isArray(req.files)) {
    req.files.forEach(f => tasks.push(optimizeFile(f)));
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach(arr => {
      (Array.isArray(arr) ? arr : [arr]).forEach(f => tasks.push(optimizeFile(f)));
    });
  }
  Promise.all(tasks).then(() => next()).catch(() => next());
}

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

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return [value];
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => value[key]);
}

function getMemberSections(member = {}) {
  const rawSections = Array.isArray(member.sections) && member.sections.length
    ? member.sections
    : [member.section || member.category || 'Специалисты'];
  return rawSections
    .map(section => (section || '').trim())
    .filter(Boolean);
}

function normalizeTeamSections(team = {}) {
  const members = Array.isArray(team.members) ? team.members : [];
  const sectionTitles = Array.isArray(team.sections) && team.sections.length
    ? team.sections
    : [];
  const sections = [];
  const byTitle = {};

  function ensureSection(title) {
    const cleanTitle = (title || 'Специалисты').trim() || 'Специалисты';
    if (!byTitle[cleanTitle]) {
      byTitle[cleanTitle] = { title: cleanTitle, members: [] };
      sections.push(byTitle[cleanTitle]);
    }
    return byTitle[cleanTitle];
  }

  sectionTitles.forEach(title => ensureSection(title));
  members.forEach(member => {
    getMemberSections(member).forEach(title => ensureSection(title).members.push(member));
  });

  if (!sections.length) {
    ensureSection('Врачебная косметология');
    ensureSection('Эстетическая косметология');
    ensureSection('Массаж и коррекция тела');
    ensureSection('Подология и ногтевой сервис');
  }

  return sections;
}

function syncTeamIntoServiceDoctors(content) {
  const members = Array.isArray(content.team && content.team.members)
    ? content.team.members
    : [];
  const byName = new Map(members.map(member => [
    (member.name || '').trim().toLowerCase(),
    member
  ]).filter(([name]) => name));

  if (!Array.isArray(content.services)) return content;

  content.services = content.services.map(service => {
    if (!Array.isArray(service.doctors)) return service;
    const doctors = service.doctors
      .map(doctor => {
        const member = byName.get((doctor.name || '').trim().toLowerCase());
        if (!member) return null;
        return {
          name: member.name,
          role: member.role || doctor.role || '',
          experience: member.experience || doctor.experience || '',
          bio: member.bio || doctor.bio || '',
          photo: member.photo || doctor.photo || '/images/doctors/default.svg'
        };
      })
      .filter(Boolean);
    return { ...service, doctors };
  });

  return content;
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
  const filePath = path.join(__dirname, 'data/callbacks.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  // Restrict file permissions (owner read/write only) — 152-ФЗ защита ПД
  try { fs.chmodSync(filePath, 0o600); } catch (_) {}
}

// Auto-purge заявок старше N дней (срок хранения ПД по 152-ФЗ)
const CALLBACK_RETENTION_DAYS = 180;
function purgeOldCallbacks() {
  const callbacks = loadCallbacks();
  const cutoff = Date.now() - CALLBACK_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const kept = callbacks.filter(c => {
    const t = c.submittedAt ? new Date(c.submittedAt).getTime() : Date.now();
    return t >= cutoff;
  });
  if (kept.length !== callbacks.length) {
    saveCallbacks(kept);
    console.log('purgeOldCallbacks: removed', callbacks.length - kept.length, 'old entries');
  }
  return kept;
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
  res.render('pages/privacy', { content });
});

app.get('/terms', (req, res) => {
  const content = loadContent();
  res.render('pages/terms', { content });
});

app.get('/consent', (req, res) => {
  const content = loadContent();
  res.render('pages/consent', { content });
});

app.get('/offer', (req, res) => {
  const content = loadContent();
  res.render('pages/offer', { content });
});

// Callback form submission
app.post('/callback', (req, res) => {
  try {
    const { name, phone, service, message, consent } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Имя и телефон обязательны' });
    }
    if (!consent) {
      return res.status(400).json({ error: 'Необходимо согласие на обработку персональных данных' });
    }

    // IP (учитываем trust proxy)
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || req.socket.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] || '').slice(0, 300);

    const callbacks = loadCallbacks();
    const newCallback = {
      id: Date.now().toString(),
      name,
      phone,
      service: service || '',
      message: message || '',
      submittedAt: new Date().toISOString(),
      read: false,
      // Метаданные согласия для 152-ФЗ (доказательство факта согласия)
      consent: {
        given: true,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
        policyUrl: '/consent'
      }
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

app.post('/admin/settings', requireAuth, upload.fields([{name: 'logo', maxCount: 1}, {name: 'favicon', maxCount: 1}]), optimizeUploads, (req, res) => {
  const content = loadContent();
  const fields = ['name', 'tagline', 'phone', 'phoneRaw', 'address', 'hours', 'email', 'vk', 'max', 'profsalon', 'license', 'company', 'mapEmbed', 'profsalonWidget', 'maxChatUrl'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) content.site[f] = req.body[f];
  });

  if (req.files && req.files.logo) {
    content.site.logo = '/uploads/' + req.files.logo[0].filename;
  }
  if (req.files && req.files.favicon) {
    content.site.favicon = '/uploads/' + req.files.favicon[0].filename;
  }

  saveContent(content);
  res.redirect('/admin/settings?saved=1');
});

// ===== HERO =====

app.get('/admin/hero', requireAuth, (req, res) => {
  res.render('admin/hero');
});

app.post('/admin/hero', requireAuth, upload.single('image'), optimizeUploads, (req, res) => {
  const content = loadContent();

  // Multi-slide mode (new)
  if (req.body.slides) {
    const raw = req.body.slides;
    let entries = [];
    if (Array.isArray(raw)) entries = raw;
    else if (typeof raw === 'object') entries = Object.keys(raw).map(k => raw[k]);

    const slides = entries
      .filter(s => s && ((s.title || '').trim() || (s.image || '').trim()))
      .map(s => ({
        title: (s.title || '').trim(),
        subtitle: (s.subtitle || '').trim(),
        promoText: (s.promoText || '').trim(),
        promoNote: (s.promoNote || '').trim(),
        image: (s.image || '').trim()
      }));

    content.hero.slides = slides;
    // Sync legacy fields to first slide for back-compat
    if (slides.length > 0) {
      content.hero.title = slides[0].title || content.hero.title;
      content.hero.subtitle = slides[0].subtitle || content.hero.subtitle;
      content.hero.promoText = slides[0].promoText;
      content.hero.promoNote = slides[0].promoNote;
      content.hero.image = slides[0].image || content.hero.image;
    }
  } else {
    // Legacy single-slide fallback
    content.hero.title = req.body.title || content.hero.title;
    content.hero.subtitle = req.body.subtitle || content.hero.subtitle;
    content.hero.promoText = req.body.promoText || content.hero.promoText;
    content.hero.promoNote = req.body.promoNote || content.hero.promoNote;
    if (req.file) content.hero.image = '/uploads/' + req.file.filename;
  }

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

app.post('/admin/services/:slug', requireAuth, upload.single('image'), optimizeUploads, (req, res) => {
  const content = loadContent();
  const idx = content.services.findIndex(s => s.slug === req.params.slug);
  if (idx === -1) return res.redirect('/admin/services');

  const service = content.services[idx];
  service.name = req.body.name || service.name;
  service.shortName = req.body.shortName || service.shortName;
  service.description = req.body.description || service.description;
  service.discount = req.body.discount !== undefined ? req.body.discount : service.discount;
  service.offerBadge = req.body.offerBadge !== undefined ? req.body.offerBadge : (service.offerBadge || '');
  service.benefitsTitle = req.body.benefitsTitle !== undefined ? req.body.benefitsTitle : (service.benefitsTitle || '');
  if (req.file) service.image = '/uploads/' + req.file.filename;

  // Tezisy (array of {icon, text})
  if (req.body.tezisyTexts) {
    const tIcons = Array.isArray(req.body.tezisyIcons) ? req.body.tezisyIcons : [req.body.tezisyIcons];
    const tTexts = Array.isArray(req.body.tezisyTexts) ? req.body.tezisyTexts : [req.body.tezisyTexts];
    service.tezisy = tTexts.map((text, i) => ({
      icon: tIcons[i] || 'star',
      text: text || ''
    })).filter(t => t.text.trim());
  } else if (req.body.tezisyEnabled !== undefined) {
    service.tezisy = [];
  }

  // Media gallery
  if (req.body.mediaEnabled !== undefined) {
    service.mediaGallery = service.mediaGallery || {};
    service.mediaGallery.enabled = req.body.mediaEnabled === '1' || req.body.mediaEnabled === 'on';
    service.mediaGallery.title = req.body.mediaTitle || service.mediaGallery.title || '';
    service.mediaGallery.videoUrl = req.body.mediaVideoUrl || '';
    service.mediaGallery.photos = service.mediaGallery.photos || [];
    if (Array.isArray(req.body.mediaPhotos)) {
      service.mediaGallery.photos = req.body.mediaPhotos.filter(p => p && p.trim());
    } else if (req.body.mediaPhotos) {
      service.mediaGallery.photos = [req.body.mediaPhotos];
    }
  }

  // SanPiN marquee
  if (req.body.sanpinText !== undefined || req.body.sanpinEnabled !== undefined) {
    service.sanpinBanner = service.sanpinBanner || {};
    service.sanpinBanner.enabled = req.body.sanpinEnabled === '1' || req.body.sanpinEnabled === 'on';
    service.sanpinBanner.text = req.body.sanpinText || '';
  }

  // Personal protocol
  if (req.body.protocolText !== undefined || req.body.protocolEnabled !== undefined) {
    service.personalProtocol = service.personalProtocol || {};
    service.personalProtocol.enabled = req.body.protocolEnabled === '1' || req.body.protocolEnabled === 'on';
    service.personalProtocol.title = req.body.protocolTitle || '';
    service.personalProtocol.text = req.body.protocolText || '';
  }

  // Booking CTA
  if (req.body.bookingCtaTitle !== undefined || req.body.bookingCtaEnabled !== undefined) {
    service.bookingCta = service.bookingCta || {};
    service.bookingCta.enabled = req.body.bookingCtaEnabled === '1' || req.body.bookingCtaEnabled === 'on';
    service.bookingCta.title = req.body.bookingCtaTitle || '';
    service.bookingCta.highlight = req.body.bookingCtaHighlight || '';
    service.bookingCta.subtitle = req.body.bookingCtaSubtitle || '';
  }

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
  const team = content.team || { title: '', subtitle: '', members: [] };
  res.render('admin/team', {
    team,
    sections: normalizeTeamSections(team),
    message: req.query.saved ? 'Изменения сохранены' : null
  });
});

app.post('/admin/team', requireAuth, upload.any(), optimizeUploads, (req, res) => {
  const content = loadContent();
  const uploadedByField = {};
  (Array.isArray(req.files) ? req.files : []).forEach(file => {
    uploadedByField[file.fieldname] = '/uploads/' + file.filename;
  });

  const sections = toArray(req.body.sections)
    .map(sectionInput => ((sectionInput && sectionInput.title) || '').trim())
    .filter(Boolean);
  const fallbackSections = sections.length ? sections : ['Специалисты'];

  const members = toArray(req.body.members)
    .map((memberInput, memberIndex) => {
      const name = ((memberInput && memberInput.name) || '').trim();
      if (!name) return null;

      const sectionIndexes = toArray(memberInput.sectionIndexes)
        .map(index => Number(index))
        .filter(index => Number.isInteger(index) && fallbackSections[index]);
      const memberSections = sectionIndexes.length
        ? sectionIndexes.map(index => fallbackSections[index])
        : [fallbackSections[0]];

      const photoField = `members[${memberIndex}][photo]`;
      const photo = uploadedByField[photoField] ||
        (memberInput.photoExisting || '').trim() ||
        '/images/team/default.svg';

      return {
        name,
        role: ((memberInput.role || '')).trim(),
        experience: ((memberInput.experience || '')).trim(),
        bio: ((memberInput.bio || '')).trim(),
        photo,
        specialties: (memberInput.specialties || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
        sections: memberSections,
        section: memberSections[0]
      };
    })
    .filter(Boolean);

  content.team = {
    title: (req.body.title || '').trim(),
    subtitle: (req.body.subtitle || '').trim(),
    sections: fallbackSections,
    members
  };
  syncTeamIntoServiceDoctors(content);
  saveContent(content);
  res.redirect('/admin/team?saved=1');
});

// ===== GALLERY PAGE =====

app.get('/admin/gallery', requireAuth, (req, res) => {
  const content = loadContent();
  res.render('admin/gallery', { gallery: content.gallery || { title: '', images: [] } });
});

app.post('/admin/gallery', requireAuth, upload.array('images', 20), optimizeUploads, (req, res) => {
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
  const promotions = content.promotions || { title: '', subtitle: '', items: [] };
  res.render('admin/promotions', {
    promoTitle: promotions.title || '',
    promoSubtitle: promotions.subtitle || '',
    promotions: Array.isArray(promotions.items) ? promotions.items : [],
    message: req.query.saved ? 'Изменения сохранены' : null
  });
});

app.post('/admin/promotions', requireAuth, (req, res) => {
  const content = loadContent();

  // Express with extended:true parses promotions[0][title] into an object/array
  const submitted = req.body.promotions || {};
  const entries = Array.isArray(submitted)
    ? submitted
    : Object.keys(submitted).sort((a, b) => Number(a) - Number(b)).map(k => submitted[k]);

  const items = entries
    .filter(p => p && (p.title || '').trim())
    .map(p => ({
      title: (p.title || '').trim(),
      description: (p.description || '').trim(),
      badge: (p.badge || '').trim(),
      icon: (p.icon || '').trim(),
      image: (p.image || '').trim(),
      link: (p.link || '').trim(),
      active: p.active === 'true' || p.active === 'on' || p.active === true
    }));

  content.promotions = {
    title: (req.body.promoTitle || '').trim() || (content.promotions && content.promotions.title) || 'Акции и специальные предложения',
    subtitle: (req.body.promoSubtitle || '').trim() || (content.promotions && content.promotions.subtitle) || '',
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
  // Автоочистка старых заявок при каждом заходе в админку
  const callbacks = purgeOldCallbacks();
  callbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.render('admin/callbacks', { callbacks, retentionDays: CALLBACK_RETENTION_DAYS });
});

app.post('/admin/callbacks/:id/delete', requireAuth, (req, res) => {
  const callbacks = loadCallbacks();
  const filtered = callbacks.filter(c => c.id !== req.params.id);
  saveCallbacks(filtered);
  res.redirect('/admin/callbacks?deleted=1');
});

// Совместимость со старой формой (body.callbackId)
app.post('/admin/callbacks/delete', requireAuth, (req, res) => {
  const id = req.body.callbackId;
  const callbacks = loadCallbacks();
  const filtered = callbacks.filter(c => c.id !== id);
  saveCallbacks(filtered);
  res.redirect('/admin/callbacks?deleted=1');
});

app.post('/admin/callbacks/status', requireAuth, (req, res) => {
  const { callbackId, status } = req.body;
  const callbacks = loadCallbacks();
  const cb = callbacks.find(c => c.id === callbackId);
  if (cb) {
    cb.status = status;
    saveCallbacks(callbacks);
  }
  res.redirect('/admin/callbacks');
});

// Массовое удаление всех заявок (для очистки ПД)
app.post('/admin/callbacks/purge-all', requireAuth, (req, res) => {
  saveCallbacks([]);
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

app.post('/admin/upload', requireAuth, upload.single('file'), optimizeUploads, (req, res) => {
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
