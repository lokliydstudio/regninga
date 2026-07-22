(() => {
  'use strict';

  const CURRENT_YEAR = 2026;
  const REFERENCE_END_AGE = 90;
  const STORAGE_KEY = 'regninga:pensjon-enkel';
  const form = document.getElementById('simplePensionForm');
  if (!form) return;

  const byId = (id) => document.getElementById(id);
  const numberValue = (id) => {
    const parsed = Number(String(byId(id)?.value ?? 0).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const setText = (id, value) => { const node = byId(id); if (node) node.textContent = value; };
  const money = (value) => new Intl.NumberFormat('nb-NO', {
    style: 'currency', currency: 'NOK', maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
  const plain = (value) => new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

  const ageFactor = (age) => {
    const remainingAt67 = REFERENCE_END_AGE - 67;
    const remainingAtAge = Math.max(8, REFERENCE_END_AGE - age);
    return clamp(remainingAt67 / remainingAtAge, 0.58, 1.85);
  };

  const annualPayout = (capital, returnPercent, years) => {
    if (capital <= 0 || years <= 0) return 0;
    const rate = returnPercent / 100;
    if (Math.abs(rate) < 0.000001) return capital / years;
    const denominator = 1 - Math.pow(1 + rate, -years);
    return denominator === 0 ? capital / years : capital * rate / denominator;
  };

  const readInputs = () => {
    const birthYear = clamp(numberValue('simpleBirthYear'), 1940, 1970);
    return {
      birthYear,
      currentAge: Math.max(0, CURRENT_YEAR - birthYear),
      salary: Math.max(0, numberValue('simpleSalary')),
      startAge: clamp(numberValue('simpleStartAge'), 62, 75),
      fullAge: clamp(numberValue('simpleFullAge'), 62, 75),
      workPercent: clamp(numberValue('simpleWorkPercent'), 0, 100),
      pensionPercent: clamp(numberValue('simplePensionPercent'), 0, 100),
      nav67: Math.max(0, numberValue('simpleNav67')),
      afp: Math.max(0, numberValue('simpleAfp')),
      workplace: Math.max(0, numberValue('simpleWorkplace')),
      privatePot: Math.max(0, numberValue('simplePrivatePot')),
      salaryTax: clamp(numberValue('simpleSalaryTax'), 0, 60),
      pensionTax: clamp(numberValue('simplePensionTax'), 0, 60),
      privateYears: Math.max(1, numberValue('simplePrivateYears')),
      privateReturn: clamp(numberValue('simplePrivateReturn'), -5, 10)
    };
  };

  const calculate = (inputs) => {
    const startAge = Math.max(inputs.currentAge, inputs.startAge);
    const fullAge = Math.max(startAge, inputs.fullAge);
    const phaseShare = inputs.pensionPercent / 100;
    const navAtStart = inputs.nav67 * ageFactor(startAge);
    const navDuringPhase = navAtStart * phaseShare;
    const navAfterFull = navDuringPhase + inputs.nav67 * ageFactor(fullAge) * (1 - phaseShare);
    const privateAnnual = annualPayout(inputs.privatePot, inputs.privateReturn, inputs.privateYears);

    const phaseSalary = inputs.salary * inputs.workPercent / 100;
    const phasePension = navDuringPhase;
    const phaseGross = phaseSalary + phasePension;
    const phaseNet = phaseSalary * (1 - inputs.salaryTax / 100) + phasePension * (1 - inputs.pensionTax / 100);

    const fullPension = navAfterFull + inputs.afp + inputs.workplace + privateAnnual;
    const fullGross = fullPension;
    const fullNet = fullPension * (1 - inputs.pensionTax / 100);
    const replacement = inputs.salary > 0 ? fullGross / inputs.salary * 100 : 0;

    return {
      startAge,
      fullAge,
      navDuringPhase,
      navAfterFull,
      privateAnnual,
      phaseSalary,
      phasePension,
      phaseGross,
      phaseNet,
      fullGross,
      fullNet,
      replacement
    };
  };

  const messagesFor = (inputs, result) => {
    const messages = [];
    if (inputs.nav67 <= 0) messages.push('Legg inn årsbeløpet fra NAV for å få et nyttig estimat.');
    if (inputs.fullAge <= inputs.startAge) messages.push('Alderen for full pensjon bør være høyere enn startalderen for å vise en nedtrappingsperiode.');
    if (inputs.startAge < inputs.currentAge) messages.push('Startalderen er passert. Kalkulatoren regner derfor nedtrappingen fra alderen din nå.');
    if (inputs.afp > 0) messages.push('AFP kan ha egne kvalifikasjons- og kombinasjonsregler. Kontroller at beløpet kan tas ut på de valgte alderstrinnene.');
    if (inputs.pensionPercent > 0 && inputs.startAge < 67) messages.push('Tidlig og gradert uttak kan gi andre NAV-beløp enn dette enkle anslaget. Sjekk valgt uttaksgrad i Din pensjon.');
    if (result.replacement < 60 && inputs.salary > 0) messages.push('Estimert pensjonsinntekt er under 60 % av dagens årslønn før skatt. Se også den detaljerte kalkulatoren.');
    if (messages.length === 0) messages.push('Dette ser ut som et sammenhengende scenario. Bekreft beløp og uttaksregler hos NAV og pensjonsleverandøren.');
    return messages;
  };

  const persist = () => {
    const data = {};
    form.querySelectorAll('input, select').forEach((node) => { if (node.id) data[node.id] = node.value; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  };

  const restore = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.entries(data).forEach(([id, value]) => { const node = byId(id); if (node) node.value = value; });
    } catch (_) {}
  };

  const update = () => {
    const inputs = readInputs();
    const result = calculate(inputs);
    setText('simpleAgeHelp', `Du er omtrent ${plain(inputs.currentAge)} år i ${CURRENT_YEAR}.`);
    setText('simpleMainResult', money(result.fullNet / 12));
    setText('simpleMainSub', `${money(result.fullGross / 12)} brutto per måned ved ${plain(result.fullAge)} år`);
    setText('simplePhaseNet', money(result.phaseNet / 12));
    setText('simplePhaseGross', `${money(result.phaseGross / 12)} brutto`);
    setText('simpleFullNet', money(result.fullNet / 12));
    setText('simpleFullGross', `${money(result.fullGross / 12)} brutto`);
    setText('simpleNavResult', `${money(result.navAfterFull / 12)} / mnd.`);
    setText('simpleAfpResult', `${money(inputs.afp / 12)} / mnd.`);
    setText('simpleWorkplaceResult', `${money(inputs.workplace / 12)} / mnd.`);
    setText('simplePrivateResult', `${money(result.privateAnnual / 12)} / mnd.`);
    setText('simpleReplacement', `${plain(result.replacement)} %`);

    const notice = byId('simplePensionNotice');
    if (notice) notice.innerHTML = messagesFor(inputs, result).map((message) => `<span>${message}</span>`).join('');
    persist();
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  byId('simpleRecalculate')?.addEventListener('click', update);
  byId('simpleReset')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    update();
  });
  byId('simplePrint')?.addEventListener('click', () => window.print());

  restore();
  update();
})();
