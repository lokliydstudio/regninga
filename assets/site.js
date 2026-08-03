(() => {
  'use strict';

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const storageKey = 'regninga-motion';
  const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const savedMotion = localStorage.getItem(storageKey);
  const reducedMotion = savedMotion === 'reduced' || (savedMotion !== 'full' && systemReduced);
  const isHome = Boolean(document.getElementById('homeSearchForm'));

  document.documentElement.classList.toggle('user-reduced-motion', reducedMotion);

  const motionButton = document.querySelector('[data-motion-toggle]');
  if (motionButton) {
    motionButton.setAttribute('aria-pressed', String(reducedMotion));
    motionButton.textContent = reducedMotion ? 'Slå på bevegelse' : 'Reduser bevegelse';
    motionButton.addEventListener('click', () => {
      localStorage.setItem(storageKey, reducedMotion ? 'full' : 'reduced');
      window.location.reload();
    });
  }

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const world = document.createElement('div');
  world.className = 'waterworld-scene';
  world.setAttribute('aria-hidden', 'true');
  world.innerHTML = [
    '<div class="waterworld-gradient" data-parallax-depth="-0.004"></div>',
    '<div class="waterworld-caustics" data-parallax-depth="0.006"></div>',
    '<div class="waterworld-surface" data-parallax-depth="0.008"></div>',
    '<div class="waterworld-bubbles"></div>',
    '<div class="waterworld-bills"></div>'
  ].join('');
  document.body.classList.add('has-waterworld');
  document.body.prepend(world);

  if (isHome && !reducedMotion) {
    const compact = window.innerWidth < 720;
    const bubbles = world.querySelector('.waterworld-bubbles');
    const bills = world.querySelector('.waterworld-bills');
    const bubbleCount = compact ? 5 : 7;
    const billCount = compact ? 2 : 3;

    for (let index = 0; index < bubbleCount; index += 1) {
      const bubble = document.createElement('span');
      bubble.className = 'water-bubble';
      bubble.style.setProperty('--left', `${randomBetween(6, 94).toFixed(2)}%`);
      bubble.style.setProperty('--size', `${randomBetween(compact ? 18 : 22, compact ? 42 : 58).toFixed(0)}px`);
      bubble.style.setProperty('--opacity', `${randomBetween(0.1, 0.23).toFixed(2)}`);
      bubble.style.setProperty('--duration', `${randomBetween(24, 36).toFixed(2)}s`);
      bubble.style.setProperty('--delay', `${randomBetween(-30, 0).toFixed(2)}s`);
      bubble.style.setProperty('--drift', `${randomBetween(-28, 28).toFixed(0)}px`);
      bubble.style.setProperty('--blur', `${randomBetween(0, 1.1).toFixed(2)}px`);
      bubbles.appendChild(bubble);
    }

    for (let index = 0; index < billCount; index += 1) {
      const bill = document.createElement('span');
      bill.className = 'water-bill';
      bill.style.setProperty('--left', `${randomBetween(9, 91).toFixed(2)}%`);
      bill.style.setProperty('--size', `${randomBetween(compact ? 46 : 52, compact ? 64 : 76).toFixed(0)}px`);
      bill.style.setProperty('--opacity', `${randomBetween(0.1, 0.2).toFixed(2)}`);
      bill.style.setProperty('--duration', `${randomBetween(30, 42).toFixed(2)}s`);
      bill.style.setProperty('--delay', `${randomBetween(-35, 0).toFixed(2)}s`);
      bill.style.setProperty('--drift', `${randomBetween(-34, 34).toFixed(0)}px`);
      bill.style.setProperty('--rotate-start', `${randomBetween(-8, 7).toFixed(1)}deg`);
      bill.style.setProperty('--rotate-mid', `${randomBetween(-12, 12).toFixed(1)}deg`);
      bill.style.setProperty('--rotate-end', `${randomBetween(-8, 8).toFixed(1)}deg`);
      bills.appendChild(bill);
    }
  }

  if (!isHome || reducedMotion) return;

  const layers = [...document.querySelectorAll('[data-parallax-depth]')];
  let pointerX = 0;
  let pointerY = 0;
  let scrollY = window.scrollY;
  let rafId = 0;

  const renderParallax = () => {
    rafId = 0;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallaxDepth || 0);
      layer.style.setProperty('--parallax-x', `${pointerX * depth * 30}px`);
      layer.style.setProperty('--parallax-y', `${pointerY * depth * 24}px`);
      layer.style.setProperty('--parallax-scroll', `${scrollY * depth}px`);
    });
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

  requestRender();
})();
