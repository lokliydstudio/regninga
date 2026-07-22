(() => {
  'use strict';

  const number = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const value = Number(String(el.value).replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  };

  const money = (value) => new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  const plain = (value, digits = 0) => new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const annuity = (principal, annualRate, years) => {
    if (principal <= 0 || years <= 0) return 0;
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  };

  const clampMin = (value, min = 0) => Math.max(min, Number.isFinite(value) ? value : min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

  const calculators = {
    bolig() {
      const price = number('price');
      const equity = number('equity');
      const rate = number('rate');
      const years = number('years');
      const common = number('common');
      const municipal = number('municipal') / 12;
      const insurance = number('insurance');
      const electricity = number('electricity');
      const maintenance = price * (number('maintenance') / 100) / 12;
      const loan = clampMin(price - equity);
      const payment = annuity(loan, rate, years);
      const operating = common + municipal + insurance + electricity + maintenance;
      const total = payment + operating;
      const stress = annuity(loan, rate + 2, years) + operating;

      set('main-result', money(total));
      set('result-year', `${money(total * 12)} per år`);
      set('loan-result', money(loan));
      set('payment-result', money(payment));
      set('operating-result', money(operating));
      set('maintenance-result', money(maintenance));
      set('stress-result', money(stress));
    },

    bil() {
      const price = number('price');
      const loanAmount = number('loanAmount');
      const rate = number('rate');
      const years = number('years');
      const depreciation = price * (number('depreciation') / 100);
      const insurance = number('insurance') * 12;
      const fees = number('fees');
      const service = number('service');
      const tires = number('tires');
      const km = clampMin(number('km'));
      const consumption = number('consumption');
      const energyPrice = number('energyPrice');
      const tollParking = number('tollParking') * 12;
      const loanMonthly = annuity(loanAmount, rate, years);
      const energyAnnual = km * (consumption / 100) * energyPrice;
      const totalAnnual = depreciation + insurance + fees + service + tires + energyAnnual + tollParking + loanMonthly * 12;
      const totalMonthly = totalAnnual / 12;
      const perKm = km > 0 ? totalAnnual / km : 0;

      set('main-result', money(totalMonthly));
      set('result-year', `${money(totalAnnual)} per år`);
      set('per-km-result', `${plain(perKm, 2)} kr`);
      set('loan-result', money(loanMonthly));
      set('depreciation-result', money(depreciation / 12));
      set('energy-result', money(energyAnnual / 12));
      set('fixed-result', money((insurance + fees + service + tires + tollParking) / 12));
    },

    pendling() {
      const distance = clampMin(number('distance'));
      const days = clampMin(number('days'));
      const weeks = clampMin(number('weeks'));
      const commuteDays = days * weeks;
      const annualKm = distance * 2 * commuteDays;
      const energyPerKm = number('energyPerKm');
      const wearPerKm = number('wearPerKm');
      const toll = number('toll') * commuteDays;
      const parking = number('parking') * commuteDays;
      const transitMonthly = number('transitMonthly');
      const transitMonths = number('transitMonths');
      const carTime = number('carTime');
      const transitTime = number('transitTime');
      const carAnnual = annualKm * (energyPerKm + wearPerKm) + toll + parking;
      const transitAnnual = transitMonthly * transitMonths;
      const carMonthly = carAnnual / 12;
      const transitMonthlyAvg = transitAnnual / 12;
      const difference = Math.abs(carAnnual - transitAnnual);
      const winner = carAnnual <= transitAnnual ? 'Bil' : 'Kollektivt';
      const carHours = carTime * 2 * commuteDays / 60;
      const transitHours = transitTime * 2 * commuteDays / 60;

      set('main-result', money(Math.min(carMonthly, transitMonthlyAvg)));
      set('result-year', `${winner} er billigst i dette anslaget`);
      set('car-result', money(carMonthly));
      set('transit-result', money(transitMonthlyAvg));
      set('difference-result', `${money(difference)} per år`);
      set('distance-result', `${plain(annualKm)} km`);
      set('car-time-result', `${plain(carHours)} timer`);
      set('transit-time-result', `${plain(transitHours)} timer`);
    },

    hund() {
      const purchase = number('purchase');
      const equipment = number('equipment');
      const course = number('course');
      const food = number('food');
      const insurance = number('insurance');
      const vet = number('vet');
      const grooming = number('grooming');
      const daycare = number('daycare');
      const misc = number('misc');
      const buffer = number('buffer');
      const monthly = food + insurance + vet + grooming + daycare + misc + buffer;
      const firstYear = purchase + equipment + course + monthly * 12;
      const laterYear = monthly * 12;

      set('main-result', money(monthly));
      set('result-year', `${money(laterYear)} per vanlig år`);
      set('first-year-result', money(firstYear));
      set('one-time-result', money(purchase + equipment + course));
      set('daily-result', `${money(laterYear / 365)} per dag`);
      set('care-result', money(vet + insurance + grooming + buffer));
    },

    barn() {
      const equipment = number('equipment');
      const stroller = number('stroller');
      const carSeat = number('carSeat');
      const room = number('room');
      const clothes = number('clothes');
      const diapers = number('diapers');
      const food = number('food');
      const childcare = number('childcare');
      const insurance = number('insurance');
      const activities = number('activities');
      const misc = number('misc');
      const benefit = number('benefit');
      const recurringGross = clothes + diapers + food + childcare + insurance + activities + misc;
      const recurringNet = clampMin(recurringGross - benefit);
      const oneTime = equipment + stroller + carSeat + room;
      const firstYearGross = oneTime + recurringGross * 12;
      const firstYearNet = oneTime + recurringNet * 12;

      set('main-result', money(recurringNet));
      set('result-year', `${money(firstYearNet)} første år etter ytelse`);
      set('gross-result', money(recurringGross));
      set('one-time-result', money(oneTime));
      set('benefit-result', money(benefit));
      set('first-year-gross-result', money(firstYearGross));
      set('first-year-net-result', money(firstYearNet));
    },

    samboer() {
      const incomeA = clampMin(number('incomeA'));
      const incomeB = clampMin(number('incomeB'));
      const total = ['housing', 'electricity', 'food', 'insurance', 'subscriptions', 'transport', 'other']
        .reduce((sum, id) => sum + clampMin(number(id)), 0);
      const combinedIncome = incomeA + incomeB;
      const model = document.getElementById('splitModel')?.value || 'income';

      let contributionA = total / 2;
      let contributionB = total / 2;
      let modelName = '50/50';

      if (model === 'income' && combinedIncome > 0) {
        contributionA = total * (incomeA / combinedIncome);
        contributionB = total - contributionA;
        modelName = 'fordelt etter nettoinntekt';
      } else if (model === 'equal-left') {
        contributionA = clamp((incomeA - incomeB + total) / 2, 0, total);
        contributionB = total - contributionA;
        modelName = 'likt beløp igjen';
      }

      const leftA = incomeA - contributionA;
      const leftB = incomeB - contributionB;
      const shareA = total > 0 ? contributionA / total * 100 : 50;
      const shareB = total > 0 ? contributionB / total * 100 : 50;
      const burdenA = incomeA > 0 ? contributionA / incomeA * 100 : 0;
      const burdenB = incomeB > 0 ? contributionB / incomeB * 100 : 0;

      set('main-result', money(total));
      set('result-year', `Fellesutgifter per måned – ${modelName}`);
      set('a-result', money(contributionA));
      set('b-result', money(contributionB));
      set('a-share-result', `${plain(shareA, 1)} %`);
      set('b-share-result', `${plain(shareB, 1)} %`);
      set('a-left-result', money(leftA));
      set('b-left-result', money(leftB));
      set('a-burden-result', `${plain(burdenA, 1)} % av inntekt`);
      set('b-burden-result', `${plain(burdenB, 1)} % av inntekt`);
    }
  };

  const page = document.body.dataset.calculator;
  if (!page || !calculators[page]) return;

  const form = document.querySelector('[data-calculator-form]');
  const storageKey = `regninga:${page}`;

  const restore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.entries(saved).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && value !== null && value !== undefined) input.value = value;
      });
    } catch (_) {
      // Ignorer ugyldige eller gamle lagrede data.
    }
  };

  const persist = () => {
    if (!form) return;
    const data = {};
    form.querySelectorAll('input, select').forEach((input) => {
      if (input.id) data[input.id] = input.value;
    });
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (_) {}
  };

  const calculate = () => {
    calculators[page]();
    persist();
  };

  restore();
  calculate();
  form?.addEventListener('input', calculate);
  form?.addEventListener('change', calculate);

  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    form?.reset();
    calculate();
  });

  document.querySelector('[data-copy]')?.addEventListener('click', async (event) => {
    const main = document.getElementById('main-result')?.textContent || '';
    const detail = document.getElementById('result-year')?.textContent || '';
    const text = `Regninga: ${main}. ${detail}.`;
    try {
      await navigator.clipboard.writeText(text);
      const old = event.currentTarget.textContent;
      event.currentTarget.textContent = 'Kopiert!';
      setTimeout(() => { event.currentTarget.textContent = old; }, 1400);
    } catch (_) {
      window.prompt('Kopier resultatet:', text);
    }
  });
})();
