(() => {
  'use strict';

  const config = window.REGNINGA_ADS || {};
  const placements = [...document.querySelectorAll('[data-ad-placement]')];
  const hide = (placement) => {
    const section = placement.closest('.ad-section');
    if (section) section.hidden = true;
  };

  if (!config.manualPlacements || !/^ca-pub-\d+$/.test(config.client || '')) {
    placements.forEach(hide);
    return;
  }

  const renderAds = () => {
    placements.forEach((placement) => {
      const name = placement.dataset.adPlacement || 'inline';
      const slot = String(config.slots?.[name] || config.slots?.inline || '');
      if (!/^\d+$/.test(slot) || placement.dataset.adInitialized === 'true') {
        hide(placement);
        return;
      }

      const section = placement.closest('.ad-section');
      if (section) section.hidden = false;
      placement.innerHTML = '<span class="ad-label">Annonse</span>';

      const ad = document.createElement('ins');
      ad.className = 'adsbygoogle';
      ad.style.display = 'block';
      ad.dataset.adClient = config.client;
      ad.dataset.adSlot = slot;
      ad.dataset.adFormat = 'auto';
      ad.dataset.fullWidthResponsive = 'true';
      placement.append(ad);
      placement.dataset.adInitialized = 'true';

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        hide(placement);
      }
    });
  };

  const script = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
  if (!script) {
    placements.forEach(hide);
    return;
  }
  if (window.adsbygoogle) renderAds();
  else {
    script.addEventListener('load', renderAds, { once: true });
    script.addEventListener('error', () => placements.forEach(hide), { once: true });
  }
})();
