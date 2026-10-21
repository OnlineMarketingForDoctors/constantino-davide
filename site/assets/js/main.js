(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header state and back-to-top ---------- */
  var header = document.querySelector('[data-header]');
  var backToTop = document.querySelector('[data-back-to-top]');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    backToTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 350);
    }
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1180 && document.body.classList.contains('menu-open')) setMenu(false);
  });

  /* ---------- Current section in nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.primary-nav a'));
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-current', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) sectionObserver.observe(target);
    });
  }

  /* ---------- Procedure panels ---------- */
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  var wideScreen = window.matchMedia('(min-width: 900px)');
  function activatePanel(panel) {
    panels.forEach(function (p) {
      var active = p === panel;
      p.classList.toggle('is-active', active);
      p.querySelector('[data-panel-btn]').setAttribute('aria-expanded', String(active));
    });
  }
  var hoverTimer;
  panels.forEach(function (panel) {
    panel.querySelector('[data-panel-btn]').addEventListener('click', function () { activatePanel(panel); });
    panel.addEventListener('mouseenter', function () {
      if (!wideScreen.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () { activatePanel(panel); }, 120);
    });
    panel.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
  });

  /* ---------- Results: filter, buttons and drag ---------- */
  var track = document.querySelector('[data-results-track]');
  var chips = document.querySelectorAll('[data-filter]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', String(active));
      });
      track.querySelectorAll('.ba-card').forEach(function (card) {
        card.hidden = filter !== 'all' && card.getAttribute('data-cat') !== filter;
      });
      track.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  function cardStep() {
    var card = track.querySelector('.ba-card:not([hidden])');
    return card ? card.getBoundingClientRect().width + 24 : 400;
  }
  document.querySelector('[data-results-prev]').addEventListener('click', function () {
    track.scrollBy({ left: -cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  document.querySelector('[data-results-next]').addEventListener('click', function () {
    track.scrollBy({ left: cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  var drag = null;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) {
      drag.moved = true;
      track.classList.add('is-dragging');
    }
    track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    drag = null;
    track.classList.remove('is-dragging');
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll('[data-accordion] button[aria-controls]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (reduceMotion) { panel.hidden = open; return; }
      if (open) {
        panel.style.height = panel.scrollHeight + 'px';
        panel.classList.add('is-animating');
        requestAnimationFrame(function () { panel.style.height = '0px'; });
        panel.addEventListener('transitionend', function done() {
          panel.hidden = true;
          panel.classList.remove('is-animating');
          panel.style.height = '';
          panel.removeEventListener('transitionend', done);
        });
      } else {
        panel.hidden = false;
        var h = panel.scrollHeight;
        panel.style.height = '0px';
        panel.classList.add('is-animating');
        requestAnimationFrame(function () { panel.style.height = h + 'px'; });
        panel.addEventListener('transitionend', function done() {
          panel.classList.remove('is-animating');
          panel.style.height = '';
          panel.removeEventListener('transitionend', done);
        });
      }
    });
  });

  /* ---------- Instagram ticker: duplicate items for a seamless loop ---------- */
  var ticker = document.querySelector('[data-ticker] .ticker-track');
  if (ticker && !reduceMotion) {
    Array.prototype.slice.call(ticker.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelector('a').setAttribute('tabindex', '-1');
      ticker.appendChild(clone);
    });
  }

  /* ---------- Image reveals ---------- */
  var reveals = document.querySelectorAll('.reveal-img');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Parallax backgrounds and journey progress ---------- */
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var journey = document.querySelector('[data-journey]');
  var journeyBar = document.querySelector('[data-journey-bar]');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    if (!reduceMotion) {
      parallax.forEach(function (el) {
        if (getComputedStyle(el).position !== 'absolute') { el.style.transform = ''; return; }
        var rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var progress = (rect.top + rect.height / 2 - vh / 2) / (vh + rect.height);
        el.style.transform = 'translate3d(0,' + (progress * -16).toFixed(2) + '%,0)';
      });
    }
    if (journey && journeyBar) {
      var r = journey.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.3);
      journeyBar.style.width = (Math.min(Math.max(p, 0), 1) * 100).toFixed(1) + '%';
    }
  }
  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  frame();

  /* ---------- Footer year ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
