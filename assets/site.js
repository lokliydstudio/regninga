(() => {
  'use strict';

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const button = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');

  if (nav && !nav.querySelector('a[href*="jobb-mindre"]')) {
    const link = document.createElement('a');
    link.href = '/jobb-mindre/';
    link.textContent = 'Jobb mindre';
    if (window.location.pathname.startsWith('/jobb-mindre')) link.setAttribute('aria-current', 'page');
    nav.appendChild(link);
  }

  if (!button || !nav) return;

  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    nav.dataset.open = 'false';
    document.body.classList.remove('nav-open');
    const label = button.querySelector('.sr-only');
    if (label) label.textContent = 'Åpne meny';
  };

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu();
    else {
      button.setAttribute('aria-expanded', 'true');
      nav.dataset.open = 'true';
      document.body.classList.add('nav-open');
      const label = button.querySelector('.sr-only');
      if (label) label.textContent = 'Lukk meny';
    }
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
})();
