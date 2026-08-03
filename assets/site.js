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

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const createAnimatedBackground = () => {
    if (document.querySelector('.waterworld-scene')) return;

    const compact = window.innerWidth < 720;
    document.body.classList.add('has-waterworld');

    const world = document.createElement('div');
    world.className = 'waterworld-scene';
    world.setAttribute('aria-hidden', 'true');
    world.innerHTML = [
      '<div class="waterworld-gradient" data-parallax-depth="-0.008"></div>',
      '<div class="waterworld-caustics" data-parallax-depth="0.012"></div>',
      '<div class="waterworld-surface" data-parallax-depth="0.016"></div>',
      '<div class="waterworld-bubbles"></div>',
      '<div class="waterworld-bills"></div>'
    ].join('');
    document.body.prepend(world);

    const bubbles = world.querySelector('.waterworld-bubbles');
    const bills = world.querySelector('.waterworld-bills');
    const bubbleCount = reducedMotion ? (compact ? 6 : 9) : (compact ? 13 : 22);
    const billCount = reducedMotion ? (compact ? 3 : 4) : (compact ? 6 : 9);

    const bubbleFragment = document.createDocumentFragment();
    for (let index = 0; index < bubbleCount; index += 1) {
      const bubble = document.createElement('span');
      bubble.className = 'water-bubble';
      bubble.style.setProperty('--left', `${randomBetween(3, 97).toFixed(2)}%`);
      bubble.style.setProperty('--size', `${randomBetween(compact ? 16 : 20, compact ? 52 : 82).toFixed(0)}px`);
      bubble.style.setProperty('--opacity', `${randomBetween(0.18, 0.5).toFixed(2)}`);
      bubble.style.setProperty('--duration', `${randomBetween(compact ? 14 : 16, compact ? 24 : 30).toFixed(2)}s`);
      bubble.style.setProperty('--delay', `${randomBetween(-24, 0).toFixed(2)}s`);
      bubble.style.setProperty('--drift', `${randomBetween(-42, 42).toFixed(0)}px`);
      bubble.style.setProperty('--blur', `${randomBetween(0, 1.5).toFixed(2)}px`);
      bubbleFragment.appendChild(bubble);
    }
    bubbles.appendChild(bubbleFragment);

    const billFragment = document.createDocumentFragment();
    for (let index = 0; index < billCount; index += 1) {
      const bill = document.createElement('span');
      bill.className = 'water-bill';
      bill.style.setProperty('--left', `${randomBetween(6, 94).toFixed(2)}%`);
      bill.style.setProperty('--size', `${randomBetween(compact ? 48 : 56, compact ? 76 : 98).toFixed(0)}px`);
      bill.style.setProperty('--opacity', `${randomBetween(0.2, 0.46).toFixed(2)}`);
      bill.style.setProperty('--duration', `${randomBetween(compact ? 20 : 22, compact ? 32 : 36).toFixed(2)}s`);
      bill.style.setProperty('--delay', `${randomBetween(-26, 0).toFixed(2)}s`);
      bill.style.setProperty('--drift', `${randomBetween(-56, 56).toFixed(0)}px`);
      bill.style.setProperty('--rotate-start', `${randomBetween(-12, 10).toFixed(1)}deg`);
      bill.style.setProperty('--rotate-mid', `${randomBetween(-22, 22).toFixed(1)}deg`);
      bill.style.setProperty('--rotate-end', `${randomBetween(-14, 14).toFixed(1)}deg`);
      billFragment.appendChild(bill);
    }
    bills.appendChild(billFragment);
  };

  createAnimatedBackground();

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
