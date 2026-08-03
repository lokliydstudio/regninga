(() => {
  'use strict';

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const button = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');

  const closeMenu = () => {
    if (!button || !nav) return;
    button.setAttribute('aria-expanded', 'false');
    nav.dataset.open = 'false';
    document.body.classList.remove('nav-open');
    const label = button.querySelector('.sr-only');
    if (label) label.textContent = 'Åpne meny';
  };

  if (button && nav) {
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
        return;
      }
      button.setAttribute('aria-expanded', 'true');
      nav.dataset.open = 'true';
      document.body.classList.add('nav-open');
      const label = button.querySelector('.sr-only');
      if (label) label.textContent = 'Lukk meny';
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    }, { passive: true });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const scene = document.createElement('div');
  scene.className = 'ambient-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = [
    '<span class="ambient-orb ambient-orb-one" data-parallax-depth="0.055"></span>',
    '<span class="ambient-orb ambient-orb-two" data-parallax-depth="-0.035"></span>',
    '<span class="ambient-orb ambient-orb-three" data-parallax-depth="0.025"></span>'
  ].join('');
  document.body.prepend(scene);

  const layers = [...document.querySelectorAll('[data-parallax-depth]')];
  const heroPanel = document.querySelector('.hero-panel');
  let pointerX = 0;
  let pointerY = 0;
  let scrollY = window.scrollY;
  let rafId = 0;

  const renderParallax = () => {
    rafId = 0;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallaxDepth || 0);
      layer.style.setProperty('--parallax-x', `${pointerX * depth * 42}px`);
      layer.style.setProperty('--parallax-y', `${pointerY * depth * 34}px`);
      layer.style.setProperty('--parallax-scroll', `${scrollY * depth}px`);
    });
    if (heroPanel && window.innerWidth > 900) {
      heroPanel.style.setProperty('--glass-shift-x', `${pointerX * 7}px`);
      heroPanel.style.setProperty('--glass-shift-y', `${pointerY * 5}px`);
      heroPanel.style.setProperty('--glass-scroll', `${Math.min(scrollY * -0.018, 0)}px`);
    }
  };

  const requestRender = () => {
    if (!rafId) rafId = window.requestAnimationFrame(renderParallax);
  };

  window.addEventListener('pointermove', (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    requestRender();
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    requestRender();
  }, { passive: true });

  window.addEventListener('resize', requestRender, { passive: true });
  requestRender();

})();
