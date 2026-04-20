/* TALIYA v2 — shared preview script */
(function(){
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.TaliyaV2 = { $, $$, prefersReduced };

  document.addEventListener('DOMContentLoaded', () => {
    /* preloader off */
    setTimeout(() => document.body.classList.add('is-loaded'), 900);

    /* lucide icons */
    if (window.lucide) lucide.createIcons();

    /* sidebar toggle */
    const burger = $('#headerBurger');
    const sidebar = $('#sidebar');
    const backdrop = $('#sidebarBackdrop');
    const open = () => { sidebar && sidebar.classList.add('is-open'); burger && burger.setAttribute('aria-expanded','true'); backdrop && backdrop.classList.add('is-visible'); document.body.style.overflow='hidden'; };
    const close = () => { sidebar && sidebar.classList.remove('is-open'); burger && burger.setAttribute('aria-expanded','false'); backdrop && backdrop.classList.remove('is-visible'); document.body.style.overflow=''; };
    burger && burger.addEventListener('click', () => sidebar && sidebar.classList.contains('is-open') ? close() : open());
    backdrop && backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => e.key === 'Escape' && close());

    /* sidebar submenu */
    $$('.sidebar__nav-item--expandable').forEach(item => {
      const link = $('.sidebar__nav-link', item);
      if (!link) return;
      link.addEventListener('click', e => {
        if (link.getAttribute('href') === '#services' || link.getAttribute('href') === '#') {
          e.preventDefault();
          item.classList.toggle('sidebar__nav-item--open');
        }
      });
    });

    /* scroll reveal */
    const reveals = $$('.reveal, .reveal-clip, .reveal-stagger');
    if ('IntersectionObserver' in window && !prefersReduced) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }});
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      reveals.forEach(el => io.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('is-in'));
    }

    /* magnetic buttons */
    if (!prefersReduced) {
      $$('.magnetic').forEach(el => {
        const child = el.firstElementChild;
        if (!child) return;
        el.addEventListener('mousemove', e => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width/2;
          const y = e.clientY - r.top - r.height/2;
          child.style.transform = `translate(${x*0.18}px, ${y*0.22}px)`;
        });
        el.addEventListener('mouseleave', () => { child.style.transform = ''; });
      });
    }

    /* parallax scroll (data-parallax only, not imgs) */
    if (!prefersReduced) {
      const items = $$('[data-parallax]').map(el => ({ el, k: parseFloat(el.dataset.parallax) || 0.1 }));
      let raf = null;
      const update = () => {
        const y = window.scrollY;
        items.forEach(({el,k}) => { el.style.transform = `translate3d(0, ${y*k}px, 0)`; });
        raf = null;
      };
      const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      schedule();
    }

    /* spotlight */
    $$('.spotlight-host').forEach(host => {
      const sp = host.querySelector('.spotlight');
      if (!sp || prefersReduced) return;
      host.addEventListener('mousemove', e => {
        const r = host.getBoundingClientRect();
        sp.style.left = (e.clientX - r.left) + 'px';
        sp.style.top = (e.clientY - r.top) + 'px';
      });
    });

    /* smooth anchor */
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 20, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });

    /* count-up */
    const counters = $$('[data-count]');
    const format = (v, t) => t % 1 !== 0 ? v.toFixed(1) : (t >= 1000 ? Math.round(v).toLocaleString('ru-RU') : Math.round(v).toString());
    const animate = el => {
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      if (prefersReduced) { el.textContent = format(target,target)+suffix; return; }
      const dur = 1800, t0 = performance.now();
      const step = t => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased, target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }}), { threshold: 0.5 });
      counters.forEach(c => io.observe(c));
    } else counters.forEach(animate);

    /* current year */
    $$('[data-current-year]').forEach(el => el.textContent = new Date().getFullYear());

    /* hero promo carousel (auto every 5s) */
    const heroMedia = $('[data-hero-media]');
    const pad = n => n < 10 ? '0' + n : '' + n;
    if (heroMedia) {
      const slides = $$('[data-hero-slide]', heroMedia);
      const total = slides.length;
      const counter = $('#heroCounter');
      const counterTotal = $('#heroCounterTotal');
      const progressBar = heroMedia.querySelector('[data-hero-progress]');
      const AUTO_MS = 5000;
      let idx = 0, timer = null;
      if (counterTotal) counterTotal.textContent = pad(total);
      const render = () => {
        slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
        if (counter) counter.textContent = pad(idx + 1);
      };
      const goTo = (n) => { idx = (n + total) % total; render(); };
      const next = () => goTo(idx + 1);
      const prev = () => goTo(idx - 1);
      const resetProgress = () => {
        if (!progressBar) return;
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth;
        progressBar.style.transition = `width ${AUTO_MS}ms linear`;
        progressBar.style.width = '100%';
      };
      const stopProgress = () => {
        if (!progressBar) return;
        const rect = progressBar.getBoundingClientRect();
        const parentW = progressBar.parentElement.getBoundingClientRect().width;
        const pct = parentW ? (rect.width / parentW) * 100 : 0;
        progressBar.style.transition = 'none';
        progressBar.style.width = pct + '%';
      };
      const start = () => {
        if (total < 2 || prefersReduced) return;
        stop();
        resetProgress();
        timer = setInterval(() => { next(); resetProgress(); }, AUTO_MS);
      };
      const stop = () => {
        if (timer) { clearInterval(timer); timer = null; }
        stopProgress();
      };
      heroMedia.addEventListener('mouseenter', stop);
      heroMedia.addEventListener('mouseleave', start);
      let sx = null;
      heroMedia.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; stop(); }, { passive: true });
      heroMedia.addEventListener('touchend', (e) => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) { (dx < 0 ? next() : prev()); }
        sx = null;
        start();
      }, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
      });
      const prevBtn = $('#heroPrev'), nextBtn = $('#heroNext');
      if (prevBtn) prevBtn.addEventListener('click', () => { prev(); start(); });
      if (nextBtn) nextBtn.addEventListener('click', () => { next(); start(); });
      render();
      start();
    }
  });
})();
