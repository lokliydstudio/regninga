(() => {
  'use strict';

  const areaNames = {
    NO1: 'NO1 – Øst-Norge',
    NO2: 'NO2 – Sørvest-Norge',
    NO3: 'NO3 – Midt-Norge',
    NO4: 'NO4 – Nord-Norge',
    NO5: 'NO5 – Vest-Norge'
  };

  const state = {
    currentSpot: 1,
    averageSpot: 1,
    selectedSpot: 1,
    prices: []
  };

  const byId = (id) => document.getElementById(id);
  const number = (id) => {
    const value = Number(String(byId(id)?.value ?? 0).replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  };
  const set = (id, value) => { if (byId(id)) byId(id).textContent = value; };
  const money = (value, digits = 2) => new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const plain = (value, digits = 0) => new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);

  const osloDateParts = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const data = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { year: data.year, month: data.month, day: data.day };
  };

  const selectedPrice = () => {
    const mode = byId('priceMode')?.value || 'current';
    if (mode === 'manual') return number('manualSpotPrice');
    if (mode === 'average') return state.averageSpot;
    return state.currentSpot;
  };

  const effectivePrice = () => selectedPrice() + Math.max(0, number('extraPrice'));

  const updatePriceUI = () => {
    state.selectedSpot = selectedPrice();
    const mode = byId('priceMode')?.value || 'current';
    byId('manualPriceField').hidden = mode !== 'manual';
    set('spotAreaName', areaNames[byId('priceArea')?.value] || 'Valgt prisområde');
    set('spotPriceNow', `${money(state.currentSpot)} / kWh`);
    set('spotPriceAverage', `${money(state.averageSpot)} / kWh`);
    set('effectivePrice', `${money(effectivePrice())} / kWh`);
    calculateAll();
    persist();
  };

  const fetchPrices = async () => {
    const area = byId('priceArea')?.value || 'NO1';
    const { year, month, day } = osloDateParts();
    const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${area}.json`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    set('spotStatus', 'Henter timepriser …');
    byId('refreshPrice')?.setAttribute('disabled', '');

    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const prices = await response.json();
      if (!Array.isArray(prices) || prices.length === 0) throw new Error('Tomt prisdatasett');

      state.prices = prices;
      const vatFactor = area === 'NO4' ? 1 : 1.25;
      const valid = prices.map((item) => Number(item.NOK_per_kWh) * vatFactor).filter(Number.isFinite);
      state.averageSpot = valid.reduce((sum, value) => sum + value, 0) / valid.length;

      const now = Date.now();
      const current = prices.find((item) => {
        const start = Date.parse(item.time_start);
        const end = Date.parse(item.time_end);
        return Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end;
      });
      state.currentSpot = current ? Number(current.NOK_per_kWh) * vatFactor : valid[0];
      set('spotStatus', `Oppdatert ${new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' }).format(new Date())}. Spotpris ${area === 'NO4' ? 'uten mva.' : 'inkl. mva.'} før tillegg.`);
    } catch (error) {
      console.warn('Kunne ikke hente strømpris:', error);
      const manualFallback = Math.max(0, number('manualSpotPrice') || 1);
      state.currentSpot = manualFallback;
      state.averageSpot = manualFallback;
      byId('priceMode').value = 'manual';
      set('spotStatus', 'Kunne ikke hente livepris. Egen pris brukes inntil videre.');
    } finally {
      window.clearTimeout(timeout);
      byId('refreshPrice')?.removeAttribute('disabled');
      updatePriceUI();
    }
  };

  const calculateShower = () => {
    const minutes = Math.max(0, number('showerMinutes'));
    const flow = Math.max(0, number('showerFlow'));
    const waterPrice = Math.max(0, number('showerWaterPrice'));
    const showers = Math.max(0, number('showersPerWeek'));
    const liters = minutes * flow;
    const temperatureRise = 30;
    const heaterEfficiency = 0.9;
    const energyKwh = liters * temperatureRise * 0.001163 / heaterEfficiency;
    const one = energyKwh * effectivePrice() + liters / 1000 * waterPrice;
    const annual = one * showers * 52;
    set('showerResult', money(one));
    set('showerMonthly', money(annual / 12));
    set('showerYearly', money(annual, 0));
  };

  const calculateEv = () => {
    const batteryEnergy = Math.max(0, number('evKwh'));
    const loss = Math.min(90, Math.max(0, number('evLoss'))) / 100;
    const charges = Math.max(0, number('evCharges'));
    const gridEnergy = loss < 1 ? batteryEnergy / (1 - loss) : batteryEnergy;
    const one = gridEnergy * effectivePrice();
    const monthly = one * charges;
    set('evResult', money(one));
    set('evMonthly', money(monthly, 0));
    set('evYearly', money(monthly * 12, 0));
  };

  const calculateAppliance = () => {
    const energy = Math.max(0, number('applianceKwh'));
    const uses = Math.max(0, number('applianceUses'));
    const one = energy * effectivePrice();
    const annual = one * uses * 52;
    set('applianceResult', money(one));
    set('applianceMonthly', money(annual / 12));
    set('applianceYearly', money(annual, 0));
  };

  const calculateHeating = () => {
    const area = Math.max(0, number('heatingArea'));
    const need = Math.max(0, number('heatingNeed'));
    const factor = Math.max(0, number('heatingFactor'));
    const boughtEnergy = area * need * factor;
    const annual = boughtEnergy * effectivePrice();
    set('heatingResult', money(annual, 0));
    set('heatingMonthly', money(annual / 12, 0));
    set('heatingEnergy', `${plain(boughtEnergy)} kWh`);
  };

  const calculateAll = () => {
    calculateShower();
    calculateEv();
    calculateAppliance();
    calculateHeating();
  };

  const storageKey = 'regninga:strom';
  const persist = () => {
    const data = {};
    document.querySelectorAll('#innhold input, #innhold select').forEach((input) => {
      if (input.id) data[input.id] = input.value;
    });
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (_) {}
  };

  const restore = () => {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.entries(data).forEach(([id, value]) => {
        const input = byId(id);
        if (input) input.value = value;
      });
    } catch (_) {}
  };

  document.querySelectorAll('[data-electricity-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.electricityTab;
      document.querySelectorAll('[data-electricity-tab]').forEach((item) => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('[data-electricity-panel]').forEach((panel) => {
        const active = panel.dataset.electricityPanel === target;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
    });
  });

  byId('appliancePreset')?.addEventListener('change', (event) => {
    if (event.target.value !== 'custom') byId('applianceKwh').value = event.target.value;
    calculateAll();
    persist();
  });

  byId('priceArea')?.addEventListener('change', fetchPrices);
  byId('priceMode')?.addEventListener('change', updatePriceUI);
  byId('manualSpotPrice')?.addEventListener('input', updatePriceUI);
  byId('extraPrice')?.addEventListener('input', updatePriceUI);
  byId('refreshPrice')?.addEventListener('click', fetchPrices);

  document.querySelectorAll('.electricity-form input, .electricity-form select').forEach((input) => {
    input.addEventListener('input', () => { calculateAll(); persist(); });
    input.addEventListener('change', () => { calculateAll(); persist(); });
  });

  restore();
  updatePriceUI();
  fetchPrices();
})();
