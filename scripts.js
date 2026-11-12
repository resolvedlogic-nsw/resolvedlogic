/* ============================================================
   Resolved Logic: scripts.js
   Runs on every page: mobile menu, strand artwork, contact form.
   The home page hero animation lives in hero.js.
   ============================================================ */
(function () {
  'use strict';

  /* ── Mobile menu ── */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Strand artwork ──
     Every <svg class="thread"> is drawn here from its data- attributes:
     data-n strands, data-h height, data-seed shape, data-mult how tangled
     (1 is the default; lower is straighter), data-dark for dark backgrounds. */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function buildThread(svg) {
    var W = 1200;
    var H = +svg.getAttribute('data-h') || 80;
    var n = +svg.getAttribute('data-n') || 9;
    var mult = svg.hasAttribute('data-mult') ? +svg.getAttribute('data-mult') : 1;
    var dark = svg.hasAttribute('data-dark') || svg.classList.contains('on-ink');
    var r = rng(+svg.getAttribute('data-seed') || 7);
    var base = [1, 0.95, 0.8, 0.6, 0.38, 0.18];
    var b0 = dark ? H * 0.1 : H * 0.28;
    var b1 = dark ? H * 0.9 : H * 0.72;
    var out = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    for (var i = 0; i < n; i++) {
      var yt = lerp(b0, b1, i / (n - 1));
      var c = base.map(function (v) { return Math.min(1, v * mult); });
      var y = function (k) { return lerp(yt, H * (0.04 + 0.92 * r()), c[k]); };
      var d = 'M0 ' + y(0).toFixed(1) +
        ' C' + (W * 0.13) + ' ' + y(1).toFixed(1) + ' ' + (W * 0.3) + ' ' + y(2).toFixed(1) + ' ' + (W * 0.46) + ' ' + y(3).toFixed(1) +
        ' S' + (W * 0.68) + ' ' + y(4).toFixed(1) + ' ' + (W * 0.8) + ' ' + y(5).toFixed(1) +
        ' S' + (W * 0.9) + ' ' + yt.toFixed(1) + ' ' + W + ' ' + yt.toFixed(1);
      var orange = (i % 3 === 0);
      var stroke = orange ? 'rgba(232,101,10,' + (dark ? 0.85 : 0.7) + ')'
                          : (dark ? 'rgba(255,255,255,0.3)' : 'rgba(25,29,38,0.35)');
      out += '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (orange ? 1.5 : 1) +
             '" vector-effect="non-scaling-stroke" stroke-linecap="round"/>';
    }
    svg.innerHTML = out;
  }
  Array.prototype.forEach.call(document.querySelectorAll('svg.thread'), buildThread);

  /* ── Contact form (posts to the Formspree address set in src/data/site.toml) ── */
  var form = document.getElementById('contact-form');
  if (form) {
    var btn = document.getElementById('submit-btn');
    var ok = document.getElementById('form-success');
    var bad = document.getElementById('form-error');
    var label = btn.textContent;

    form.addEventListener('input', function (e) {
      ok.hidden = true; bad.hidden = true;
      if (e.target.classList) e.target.classList.remove('invalid');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (f) {
        var empty = !f.value.trim();
        f.classList.toggle('invalid', empty);
        if (empty) valid = false;
      });
      if (!valid) { form.querySelector('.invalid').focus(); return; }

      btn.disabled = true; btn.textContent = 'Sending…';
      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('Server error');
        form.reset(); ok.hidden = false;
      }).catch(function () {
        bad.hidden = false;
      }).then(function () {
        btn.disabled = false; btn.textContent = label;
      });
    });
  }
})();
