/* ==========================================================================
   TALIYA — main.js (v4)
   Sidebar + Mobile overlay + Scroll animations + Promo carousel + Accordion
   ========================================================================== */

(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initScrollAnimations();
    initSidebar();
    initSidebarSubmenu();
    initHeroSlider();
    initPromoCarousel();
    initPriceAccordion();
    initLazyImages();
    initCurrentYear();
  }

  // ===== HERO SLIDER =====
  function initHeroSlider() {
    const root = document.querySelector('[data-hero-slider]');
    if (!root) return;
    const texts = Array.from(root.querySelectorAll('[data-hero-slide-text]'));
    const images = Array.from(root.querySelectorAll('[data-hero-slide-image]'));
    const notes = Array.from(root.querySelectorAll('[data-hero-slide-note]'));
    const counter = root.querySelector('[data-hero-counter]');
    const prevBtn = root.querySelector('[data-hero-prev]');
    const nextBtn = root.querySelector('[data-hero-next]');
    const total = texts.length;
    if (total < 2) return;

    let current = 0;
    const AUTO_MS = 7000;
    let timer = null;

    const pad = (n) => (n < 10 ? '0' + n : '' + n);

    function go(index) {
      current = ((index % total) + total) % total;
      texts.forEach((el, i) => el.classList.toggle('is-active', i === current));
      images.forEach((el, i) => el.classList.toggle('is-active', i === current));
      notes.forEach((el, i) => el.classList.toggle('is-active', i === current));
      if (counter) counter.textContent = pad(current + 1);
    }
    const next = () => go(current + 1);
    const prev = () => go(current - 1);

    function start() { stop(); timer = setInterval(next, AUTO_MS); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); start(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); start(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    // swipe
    let startX = null;
    root.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
      startX = null;
      start();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });

    go(0);
    start();
  }

  // ===== 1. SCROLL ANIMATIONS =====
  function initScrollAnimations() {
    const targets = $$('.fade-in');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => io.observe(el));
  }

  // ===== 2. SIDEBAR (mobile overlay) =====
  function initSidebar() {
    const sidebar = $('#sidebar');
    const burger = $('#headerBurger');
    const backdrop = $('#sidebarBackdrop');
    if (!sidebar || !burger) return;

    const open = () => {
      sidebar.classList.add('sidebar--open');
      burger.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.classList.add('sidebar-backdrop--visible');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      sidebar.classList.remove('sidebar--open');
      burger.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.classList.remove('sidebar-backdrop--visible');
      document.body.style.overflow = '';
    };
    const toggle = () => {
      if (sidebar.classList.contains('sidebar--open')) close();
      else open();
    };

    burger.addEventListener('click', toggle);
    if (backdrop) backdrop.addEventListener('click', close);

    // close on nav link click (mobile)
    $$('.sidebar__nav-link, .sidebar__subnav-link', sidebar).forEach((link) => {
      link.addEventListener('click', (e) => {
        // don't close when opening submenu toggle
        if (link.classList.contains('sidebar__nav-link') && link.querySelector('.sidebar__nav-caret')) return;
        if (window.innerWidth <= 900) close();
      });
    });

    // close on Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('sidebar--open')) close();
    });

    // close when crossing the breakpoint from mobile → desktop
    let wasNarrow = window.innerWidth <= 900;
    window.addEventListener('resize', () => {
      const isNarrow = window.innerWidth <= 900;
      if (wasNarrow && !isNarrow) close();
      wasNarrow = isNarrow;
    }, { passive: true });
  }

  // ===== 3. SIDEBAR EXPANDABLE SUBMENU =====
  function initSidebarSubmenu() {
    $$('.sidebar__nav-item--expandable').forEach((item) => {
      const link = $('.sidebar__nav-link', item);
      if (!link) return;
      // Open by default on desktop if current page is a service page
      if (window.location.pathname.indexOf('/service/') === 0) {
        item.classList.add('sidebar__nav-item--open');
      }
      link.addEventListener('click', (e) => {
        e.preventDefault();
        item.classList.toggle('sidebar__nav-item--open');
      });
    });
  }

  // ===== 4. PROMO CAROUSEL =====
  function initPromoCarousel() {
    const carousel = $('#promoCarousel');
    if (!carousel) return;
    const track = $('[data-promo-track]', carousel);
    const slides = $$('[data-promo-slide]', carousel);
    const prevBtn = $('[data-promo-prev]', carousel);
    const nextBtn = $('[data-promo-next]', carousel);
    const dots = $$('[data-promo-dot]', carousel);
    if (!track || slides.length === 0) return;

    let current = 0;
    const total = slides.length;
    const AUTO_MS = 6000;
    let autoTimer = null;

    function go(index) {
      current = ((index % total) + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('promo-carousel__dot--active', i === current));
    }
    const next = () => go(current + 1);
    const prev = () => go(current - 1);

    function startAuto() {
      if (total < 2) return;
      stopAuto();
      autoTimer = setInterval(next, AUTO_MS);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); startAuto(); }));

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // swipe
    let startX = null;
    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      stopAuto();
    }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
      startX = null;
      startAuto();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto(); else startAuto();
    });

    go(0);
    startAuto();
  }

  // ===== 5. PRICE ACCORDION =====
  function initPriceAccordion() {
    $$('.price-group__header').forEach((header) => {
      header.addEventListener('click', () => {
        const group = header.closest('.price-group');
        if (!group) return;
        const isOpen = group.classList.contains('price-group--open');
        const parent = group.parentElement;
        if (parent) {
          $$('.price-group--open', parent).forEach((g) => {
            if (g !== group) g.classList.remove('price-group--open');
          });
        }
        group.classList.toggle('price-group--open', !isOpen);
      });
    });
  }

  // ===== 6. LAZY IMAGES =====
  function initLazyImages() {
    const imgs = $$('img[data-src]');
    if (imgs.length === 0) return;
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(img => { img.src = img.dataset.src; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          io.unobserve(img);
        }
      });
    }, { rootMargin: '150px' });
    imgs.forEach(img => io.observe(img));
  }

  // ===== 7. CURRENT YEAR =====
  function initCurrentYear() {
    $$('[data-current-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

})();

// ===== PRICE ACCORDION (service page) — global for inline onclick =====
window.togglePriceAccordion = function (btn) {
  var item = btn.closest('.price-accordion__item');
  var accordion = btn.closest('.price-accordion');
  if (!item || !accordion) return;
  var isOpen = item.classList.contains('price-accordion__item--open');
  accordion.querySelectorAll('.price-accordion__item').forEach(function (el) {
    el.classList.remove('price-accordion__item--open');
    var body = el.querySelector('.price-accordion__body');
    if (body) body.style.display = 'none';
  });
  if (!isOpen) {
    item.classList.add('price-accordion__item--open');
    var body = item.querySelector('.price-accordion__body');
    if (body) body.style.display = '';
  }
};
