/* ============================================================
   InspireU Disability Support — main.js v2.1
   ============================================================ */

/* NOTE FOR DJANGO MIGRATION:
   When moving to Django/Jinja2, the nav and footer will be
   {% include 'partials/header.html' %} / footer.html
   This JS file stays as-is — just update the Django static tag. */

(function () {
  'use strict';

  /* ── FONT FLASH PREVENTION ── */
  /* Fonts are loaded via <link rel="preload"> in each page head.
     We use font-display:swap in the Google Fonts URL to prevent FOUT. */

  /* ── NAV SCROLL ── */
  var header = document.querySelector('.site-header');
  var isHeroPage = header && header.classList.contains('hero-mode-init');

  function updateNav() {
    if (!header) return;
    if (isHeroPage) {
      if (window.scrollY > 60) {
        header.classList.remove('hero-mode');
        header.classList.add('scrolled', 'solid');
      } else {
        header.classList.add('hero-mode');
        header.classList.remove('scrolled', 'solid');
      }
    }
  }
  if (header) {
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  /* ── MOBILE NAV ── */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks  = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (header && !header.contains(e.target) && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── ACTIVE NAV LINK ── */
  (function () {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('/').pop();
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ── SCROLL REVEAL ── */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseInt(el.dataset.revealDelay || '0', 10);
          setTimeout(function () { el.classList.add('revealed'); }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) {
      el.classList.add('will-reveal');
      observer.observe(el);
    });
  }

  /* ── BACK TO TOP BUTTON ── */
  var fabTop = document.getElementById('fab-top');
  if (fabTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        fabTop.classList.add('visible');
      } else {
        fabTop.classList.remove('visible');
      }
    }, { passive: true });
    fabTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── ACCESSIBILITY TOGGLE ── */
document.addEventListener('DOMContentLoaded', function() {
  const a11yBtn = document.querySelector('.fab-a11y'); // Or whatever ID/class you used for the ♿ button
  
  if (a11yBtn) {
    // 1. Check local storage on load
    if (localStorage.getItem('a11y-mode') === 'true') {
      document.documentElement.classList.add('a11y-mode');
    }

    // 2. Toggle on click
    a11yBtn.addEventListener('click', function () {
      document.documentElement.classList.toggle('a11y-mode');
      
      // 3. Save the new state to local storage
      const isActive = document.documentElement.classList.contains('a11y-mode');
      localStorage.setItem('a11y-mode', isActive);
    });
  }
});

  /* Load saved preference immediately */
  var savedA11y = localStorage.getItem(A11Y_KEY) === 'true';
  applyA11y(savedA11y);

  if (fabA11y) {
    fabA11y.addEventListener('click', function () {
      var isOn = document.body.classList.contains('a11y-mode');
      var newState = !isOn;
      localStorage.setItem(A11Y_KEY, String(newState));
      applyA11y(newState);
    });
  }

  /* ── FILE UPLOAD LABEL ── */
  document.querySelectorAll('input[type="file"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var label = document.querySelector('label[for="' + input.id + '"] p');
      if (label && input.files.length > 0) {
        label.innerHTML = '<strong>✓ ' + input.files[0].name + '</strong>';
      }
    });
  });

  /* ── ENQUIRY FORM ── */
  var form = document.getElementById('enquiry-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.btn-submit');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(function () {
        var success = document.getElementById('form-success');
        if (success) {
          form.style.display = 'none';
          success.hidden = false;
          success.focus();
        } else {
          btn.textContent = '✓ Sent! We\'ll be in touch soon.';
          btn.style.background = 'linear-gradient(135deg,#059669,#10B981)';
        }
      }, 1200);
    });
  }

  /* ── SMOOTH SCROLL for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        var hh = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - hh - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

})();
