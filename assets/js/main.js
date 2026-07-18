/* Micro-interactions runtime: theme toggle, scroll reveal, mobile nav. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme toggle (persisted) ---- */
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      // tactile press feedback
      toggle.animate(
        [{ transform: 'scale(.82)' }, { transform: 'scale(1)' }],
        { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' }
      );
    });
  }

  /* ---- Sticky nav shadow ---- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  var scrim = document.getElementById('navScrim');
  function closeMenu() {
    if (!links) return;
    links.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      if (scrim) scrim.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    if (scrim) scrim.addEventListener('click', closeMenu);
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---- Scroll reveal ---- */
  var targets = document.querySelectorAll('.reveal, [data-stagger]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(function (el) { io.observe(el); });
})();
