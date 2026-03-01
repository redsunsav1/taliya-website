document.addEventListener('DOMContentLoaded', () => {
  // ── Scroll Animations (Intersection Observer) ──────────────────────────
  const animatedSelectors = '.fade-in, .slide-left, .slide-right, .scale-in';

  const animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        if (el.classList.contains('stagger')) {
          [...el.children].forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.1}s`;
            child.classList.add('visible');
          });
        } else {
          el.classList.add('visible');
        }
        animationObserver.unobserve(el);
      });
    },
    { threshold: 0.01, rootMargin: '0px 0px 50px 0px' }
  );

  document.querySelectorAll(animatedSelectors).forEach((el) => {
    animationObserver.observe(el);
  });

  // ── Header Scroll Effect ───────────────────────────────────────────────
  const header = document.querySelector('.header');

  if (header) {
    const onHeaderScroll = () => {
      header.classList.toggle('header--scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  // ── Mobile Menu Toggle ─────────────────────────────────────────────────
  const burger = document.getElementById('headerBurger');
  const mobileMenu = document.getElementById('mobileMenu');

  const toggleMenu = (open) => {
    if (!burger || !mobileMenu) return;
    const isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('mobile-menu--open');
    mobileMenu.classList.toggle('mobile-menu--open', isOpen);
    burger.classList.toggle('header__burger--active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => toggleMenu());

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    document.addEventListener('click', (e) => {
      if (
        mobileMenu.classList.contains('mobile-menu--open') &&
        !mobileMenu.contains(e.target) &&
        !burger.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });
  }

  // ── Smooth Scroll for Anchor Links ─────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      const headerOffset = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Counter Animation ──────────────────────────────────────────────────
  const counters = document.querySelectorAll('[data-count]');

  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const duration = 1500;
          const start = performance.now();

          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target;
          };

          requestAnimationFrame(step);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((c) => counterObserver.observe(c));
  }

  // ── Lazy Loading Images ────────────────────────────────────────────────
  const lazyImages = document.querySelectorAll('img[data-src]');

  if (lazyImages.length) {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.removeAttribute('data-src');
          img.addEventListener('load', () => img.classList.add('loaded'));
          imageObserver.unobserve(img);
        });
      },
      { rootMargin: '200px' }
    );

    lazyImages.forEach((img) => imageObserver.observe(img));
  }

  // ── Hero Parallax Effect ───────────────────────────────────────────────
  const hero = document.querySelector('.hero');

  if (hero) {
    window.addEventListener(
      'scroll',
      () => {
        const offset = window.scrollY;
        if (offset < window.innerHeight) {
          hero.style.backgroundPositionY = `${offset * 0.4}px`;
        }
      },
      { passive: true }
    );
  }

  // ── Service Cards Touch Support ────────────────────────────────────────
  const serviceCards = document.querySelectorAll('.service-card');

  if ('ontouchstart' in window && serviceCards.length) {
    let activeCard = null;

    serviceCards.forEach((card) => {
      card.addEventListener('touchstart', (e) => {
        if (activeCard && activeCard !== card) {
          activeCard.classList.remove('service-card--hover');
        }
        card.classList.toggle('service-card--hover');
        activeCard = card.classList.contains('service-card--hover') ? card : null;
      });
    });

    document.addEventListener('touchstart', (e) => {
      if (activeCard && !activeCard.contains(e.target)) {
        activeCard.classList.remove('service-card--hover');
        activeCard = null;
      }
    });
  }

  // ── Price Table Enhancements ───────────────────────────────────────────
  const priceTables = document.querySelectorAll('.price-table');

  priceTables.forEach((table) => {
    // Row hover highlight
    table.querySelectorAll('tbody tr').forEach((row) => {
      row.addEventListener('mouseenter', () => row.classList.add('highlight'));
      row.addEventListener('mouseleave', () => row.classList.remove('highlight'));
    });

    // Horizontal scroll wrapper for mobile
    if (!table.parentElement.classList.contains('table-scroll-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('table-scroll-wrapper');
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  // ── Stagger Observer for Late-added Elements ───────────────────────────
  document.querySelectorAll('.stagger').forEach((parent) => {
    if (![...parent.classList].some((c) => ['fade-in', 'slide-left', 'slide-right', 'scale-in'].includes(c))) {
      animationObserver.observe(parent);
    }
  });
});

// ── Price Accordion ──────────────────────────────────────────────────────
function togglePriceAccordion(btn) {
  const item = btn.closest('.price-accordion__item');
  const accordion = btn.closest('.price-accordion');
  const isOpen = item.classList.contains('price-accordion__item--open');

  // Close all items in this accordion
  accordion.querySelectorAll('.price-accordion__item').forEach(function(el) {
    el.classList.remove('price-accordion__item--open');
    const body = el.querySelector('.price-accordion__body');
    if (body) body.style.display = 'none';
  });

  // If was closed — open it
  if (!isOpen) {
    item.classList.add('price-accordion__item--open');
    const body = item.querySelector('.price-accordion__body');
    if (body) body.style.display = '';

    // Scroll into view smoothly
    setTimeout(function() {
      btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}
