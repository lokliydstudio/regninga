(() => {
  'use strict';

  const STORAGE_KEY = 'regninga:jobb-mindre';
  const form = document.getElementById('workLessForm');
  if (!form) return;

  const byId = (id) => document.getElementById(id);
  const value = (id) => {
    const parsed = Number(String(byId(id)?.value ?? 0).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const clamp = (number, min, max) => Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
  const set = (id, text) => { const node = byId(id); if (node) node.textContent = text; };
  const money = (number) => new Intl.NumberFormat('nb-NO', {
    style: 'currency', currency: 'NOK', maximumFractionDigits: 0
  }).format(Number.isFinite(number) ? number : 0);
  const plain = (number, digits = 0) => new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits: digits, minimumFractionDigits: digits
  }).format(Number.isFinite(number) ? number : 0);

  const futureValueOfAnnualSavings = (annualAmount, ratePercent, years) => {
    if (annualAmount <= 0 || years <= 0) return 0;
    const rate = ratePercent / 100;
    if (Math.abs(rate) < 0.000001) return annualAmount * years;
    return annualAmount * ((Math.pow(1 + rate, years) - 1) / rate);
  };

  const read = () => {
    const currentPercent = clamp(value('currentPercent'), 1, 100);
    const desiredPercent = clamp(value('desiredPercent'), 0, currentPercent);
    return {
      currentNet: Math.max(0, value('currentNet')),
      newNetManual: Math.max(0, value('newNetManual')),
      currentPercent,
      desiredPercent,
      monthlyExpenses: Math.max(0, value('monthlyExpenses')),
      minimumBuffer: Math.max(0, value('minimumBuffer')),
      fullTimeHours: clamp(value('fullTimeHours'), 1, 60),
      workWeeks: clamp(value('workWeeks'), 1, 52),
      currentDays: clamp(value('currentDays'), 1, 7),
      desiredDays: clamp(value('desiredDays'), 0, 7),
      commuteCost: Math.max(0, value('commuteCost')),
      foodCost: Math.max(0, value('foodCost')),
      otherDailyCost: Math.max(0, value('otherDailyCost')),
      otherMonthlySavings: Math.max(0, value('otherMonthlySavings')),
      grossAnnual: Math.max(0, value('grossAnnual')),
      pensionRate: clamp(value('pensionRate'), 0, 30),
      yearsToPension: clamp(value('yearsToPension'), 0, 50),
      pensionReturn: clamp(value('pensionReturn'), -5, 15)
    };
  };

  const calculate = (input) => {
    const ratio = input.desiredPercent / input.currentPercent;
    const estimatedNewNet = input.currentNet * ratio;
    const newNet = input.newNetManual > 0 ? input.newNetManual : estimatedNewNet;
    const salaryLoss = input.currentNet - newNet;

    const savedDaysPerWeek = Math.max(0, input.currentDays - input.desiredDays);
    const savedDaysPerMonth = savedDaysPerWeek * input.workWeeks / 12;
    const dailyWorkCost = input.commuteCost + input.foodCost + input.otherDailyCost;
    const workSavings = savedDaysPerMonth * dailyWorkCost + input.otherMonthlySavings;
    const realMonthlyCost = salaryLoss - workSavings;

    const freeHoursPerWeek = input.fullTimeHours * (input.currentPercent - input.desiredPercent) / 100;
    const freeHoursPerMonth = freeHoursPerWeek * input.workWeeks / 12;
    const costPerHour = freeHoursPerMonth > 0 ? realMonthlyCost / freeHoursPerMonth : 0;

    const availableAfterExpenses = newNet + workSavings - input.monthlyExpenses;
    const currentAvailable = input.currentNet - input.monthlyExpenses;

    const grossAfter = input.grossAnnual * ratio;
    const annualGrossLoss = Math.max(0, input.grossAnnual - grossAfter);
    const annualPensionLoss = annualGrossLoss * input.pensionRate / 100;
    const pensionPotLoss = futureValueOfAnnualSavings(annualPensionLoss, input.pensionReturn, input.yearsToPension);

    return {
      ratio, newNet, salaryLoss, workSavings, realMonthlyCost,
      savedDaysPerMonth, freeHoursPerMonth, costPerHour,
      availableAfterExpenses, currentAvailable,
      annualPensionLoss, pensionPotLoss
    };
  };

  const verdict = (input, result) => {
    if (input.desiredPercent >= input.currentPercent) {
      return { level: 'neutral', title: 'Velg en lavere stillingsprosent', lead: 'Den ønskede stillingsprosenten må være lavere enn den du har i dag.' };
    }
    if (result.availableAfterExpenses < 0) {
      return { level: 'danger', title: 'Regnestykket går ikke opp', lead: `Du mangler omtrent ${money(Math.abs(result.availableAfterExpenses))} per måned etter nødvendige utgifter.` };
    }
    if (result.availableAfterExpenses < input.minimumBuffer) {
      return { level: 'warning', title: 'Det kan bli stramt', lead: `Du har omtrent ${money(result.availableAfterExpenses)} igjen, som er mindre enn ønsket buffer.` };
    }
    return { level: 'positive', title: 'Det ser mulig ut', lead: `Du har omtrent ${money(result.availableAfterExpenses)} igjen etter nødvendige utgifter.` };
  };

  const persist = () => {
    const data = {};
    form.querySelectorAll('input, select').forEach((node) => { if (node.id) data[node.id] = node.value; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  };

  const restore = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.entries(data).forEach(([id, saved]) => { const node = byId(id); if (node) node.value = saved; });
    } catch (_) {}
  };

  const update = () => {
    const input = read();
    const result = calculate(input);
    const state = verdict(input, result);
    const status = byId('affordabilityStatus');
    if (status) {
      status.textContent = state.title;
      status.dataset.level = state.level;
    }
    set('resultLead', state.lead);

    const mainLabel = result.realMonthlyCost < 0 ? 'Du kan spare per måned' : 'Reell kostnad ved å jobbe mindre';
    const label = document.querySelector('.work-less-result .result-main .label');
    if (label) label.textContent = mainLabel;
    set('main-result', money(Math.abs(result.realMonthlyCost)));
    set('result-year', result.realMonthlyCost < 0 ? 'etter spart arbeidstid og jobbrelaterte utgifter' : `${money(result.realMonthlyCost * 12)} per år`);
    set('currentNetResult', money(input.currentNet));
    set('newNetResult', money(result.newNet));
    set('leftAfterResult', money(result.availableAfterExpenses));
    set('freeTimeResult', `${plain(result.freeHoursPerMonth, 1)} t/mnd.`);
    set('salaryLossResult', money(result.salaryLoss));
    set('savingsResult', money(result.workSavings));
    set('hourCostResult', result.freeHoursPerMonth > 0 ? `${money(Math.abs(result.costPerHour))}${result.costPerHour < 0 ? ' spart' : ''}` : '–');
    set('annualCostResult', money(result.realMonthlyCost * 12));
    set('annualPensionLossResult', money(result.annualPensionLoss));
    set('pensionPotLossResult', money(result.pensionPotLoss));

    const notice = byId('workLessNotice');
    if (notice) {
      const notes = [];
      if (input.newNetManual <= 0) notes.push('Ny nettolønn er beregnet forholdsmessig. Skatt kan gjøre den faktiske nettolønnen annerledes.');
      if (input.desiredDays >= input.currentDays && result.workSavings > input.otherMonthlySavings) notes.push('Du har ikke lagt inn færre arbeidsdager, så daglige arbeidsutgifter reduseres ikke.');
      if (input.pensionRate > 0) notes.push('Pensjonsanslaget bruker bruttolønn og den satsen du har lagt inn. Faktiske ordninger kan ha grenser og andre beregningsregler.');
      notes.push('Sjekk også hvordan redusert stilling påvirker ferie, sykepenger, forsikringer og andre ytelser hos arbeidsgiveren din.');
      notice.innerHTML = notes.map((note) => `<span>${note}</span>`).join('');
    }
    persist();
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  byId('resetWorkLess')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    update();
  });
  byId('copyWorkLess')?.addEventListener('click', async (event) => {
    const text = `Regninga: Å jobbe mindre koster omtrent ${byId('main-result')?.textContent || '–'} per måned. Ny nettolønn: ${byId('newNetResult')?.textContent || '–'}. Ekstra fritid: ${byId('freeTimeResult')?.textContent || '–'}.`;
    try {
      await navigator.clipboard.writeText(text);
      const old = event.currentTarget.textContent;
      event.currentTarget.textContent = 'Kopiert!';
      setTimeout(() => { event.currentTarget.textContent = old; }, 1400);
    } catch (_) {
      window.prompt('Kopier resultatet:', text);
    }
  });

  restore();
  update();
})();
