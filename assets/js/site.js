/*!
 * PROJECTS / 系统索引
 * theme · nav · reveal · scrollspy
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('pj-theme'); } catch (e) {}
  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.dataset.theme = theme;

  function paintTheme(next) {
    root.dataset.theme = next;
    try { localStorage.setItem('pj-theme', next); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#05090f' : '#e7eef7');
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    });
    window.dispatchEvent(new CustomEvent('pj:theme', { detail: { theme: next } }));
  }

  function boot() {
    paintTheme(theme);

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        paintTheme(theme);
      });
    });

    var nav = document.getElementById('nav');
    var bar = document.querySelector('.read-progress span');
    var ticking = false;
    var spyLinks = [];
    var spySections = [];

    function updateSpy() {
      if (!spySections.length) return;
      var mid = window.innerHeight * 0.42;
      var current = null;
      for (var i = 0; i < spySections.length; i++) {
        var rect = spySections[i].getBoundingClientRect();
        if (rect.top <= mid && rect.bottom > mid) { current = spyLinks[i]; break; }
      }
      spyLinks.forEach(function (link, i) {
        if (link === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    function onScroll() {
      var top = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (max > 0 ? Math.min(100, (top / max) * 100) : 0) + '%';
      if (nav) nav.classList.toggle('is-scrolled', top > 24);
      updateSpy();
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });

    var reveal = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveal.forEach(function (el) { io.observe(el); });
    } else {
      reveal.forEach(function (el) { el.classList.add('is-in'); });
    }

    spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
    spySections = spyLinks.map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    }).filter(Boolean);

    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
