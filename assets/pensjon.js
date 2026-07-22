(() => {
  'use strict';

  const CURRENT_YEAR = 2026;
  const G_2026 = 136549;
  const NAV_CAP = 7.1 * G_2026;
  const STORAGE_KEY = 'regninga:pensjon';
  const REFERENCE_END_AGE = 90;

  const form = document.getElementById('pensionForm');
  if (!form) return;

  const el = (id) => document.getElementById(id);
  const value = (id) => {
    const node = el(id);
    const parsed = Number(String(node?.value ?? 0).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const text = (id, content) => {
    const node = el(id);
    if (node) node.textContent = content;
  };
  const clamp = (number, min, max) => Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
  const money = (number) => new Intl.NumberFormat('nb-NO', {
    style: 'currency', currency: 'NOK', maximumFractionDigits: 0
  }).format(Number.isFinite(number) ? number : 0);
  const compactMoney = (number) => new Intl.NumberFormat('nb-NO', {
    notation: 'compact', maximumFractionDigits: 1
  }).format(Number.isFinite(number) ? number : 0) + ' kr';
  const plain = (number, digits = 0) => new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  }).format(Number.isFinite(number) ? number : 0);

  const ageFactor = (age) => {
    const remainingAt67 = REFERENCE_END_AGE - 67;
    const remainingAtAge = Math.max(8, REFERENCE_END_AGE - age);
    return clamp(remainingAt67 / remainingAtAge, 0.58, 1.85);
  };

  const annualPayout = (pot, annualReturnPercent, years) => {
    if (pot <= 0 || years <= 0) return 0;
    const rate = annualReturnPercent / 100;
    if (Math.abs(rate) < 0.000001) return pot / years;
    const denominator = 1 - Math.pow(1 + rate, -years);
    return denominator === 0 ? pot / years : pot * rate / denominator;
  };

  const futurePrivatePot = (inputs, contributionStopAge) => {
    let pot = Math.max(0, inputs.privatePot);
    const monthsToStart = Math.max(0, Math.round((inputs.privateStartAge - inputs.currentAge) * 12));
    const monthlyRate = Math.pow(1 + inputs.privateReturn / 100, 1 / 12) - 1;
    for (let month = 0; month < monthsToStart; month += 1) {
      pot *= (1 + monthlyRate);
      const ageAtMonth = inputs.currentAge + month / 12;
      if (ageAtMonth < contributionStopAge) pot += Math.max(0, inputs.privateMonthlySaving);
    }
    return pot;
  };

  const readInputs = () => {
    const birthYear = clamp(value('birthYear'), 1940, 1970);
    const currentAge = Math.max(0, CURRENT_YEAR - birthYear);
    return {
      birthYear,
      currentAge,
      currentSalary: Math.max(0, value('currentSalary')),
      currentWorkPercent: clamp(value('currentWorkPercent'), 0, 100),
      lifeAge: clamp(value('lifeAge'), 75, 105),
      phaseStartAge: clamp(value('phaseStartAge'), 62, 75),
      fullRetirementAge: clamp(value('fullRetirementAge'), 62, 75),
      phaseWorkPercent: clamp(value('phaseWorkPercent'), 0, 100),
      phasePensionPercent: clamp(value('phasePensionPercent'), 0, 100),
      navAnnual67: Math.max(0, value('navAnnual67')),
      navAnnualPhaseExact: Math.max(0, value('navAnnualPhaseExact')),
      futureNavMode: el('futureNavMode')?.value || 'none',
      futureNavManual: Math.max(0, value('futureNavManual')),
      salaryTaxRate: clamp(value('salaryTaxRate'), 0, 60),
      pensionTaxRate: clamp(value('pensionTaxRate'), 0, 60),
      afpType: el('afpType')?.value || 'none',
      afpAnnual: Math.max(0, value('afpAnnual')),
      afpStartAge: clamp(value('afpStartAge'), 62, 75),
      afpTemporaryMonthly: Math.max(0, value('afpTemporaryMonthly')),
      workplaceAnnual: Math.max(0, value('workplaceAnnual')),
      workplaceStartAge: clamp(value('workplaceStartAge'), 62, 75),
      workplacePhasePercent: clamp(value('workplacePhasePercent'), 0, 100),
      workplaceDuration: Math.max(1, value('workplaceDuration')),
      privatePot: Math.max(0, value('privatePot')),
      privateMonthlySaving: Math.max(0, value('privateMonthlySaving')),
      privateReturn: clamp(value('privateReturn'), -5, 15),
      privateReturnDuring: clamp(value('privateReturnDuring'), -5, 12),
      privateStartAge: clamp(value('privateStartAge'), 62, 80),
      privateDuration: Math.max(1, value('privateDuration')),
      otherAnnual: Math.max(0, value('otherAnnual'))
    };
  };

  const historySummary = () => {
    const rows = [1, 2, 3].map((index) => ({
      years: Math.max(0, value(`workYears${index}`)),
      percent: clamp(value(`workPercent${index}`), 0, 100),
      salary: Math.max(0, value(`workSalary${index}`))
    }));
    const years = rows.reduce((sum, row) => sum + row.years, 0);
    const fullYears = rows.reduce((sum, row) => sum + row.years * row.percent / 100, 0);
    const averagePercent = years > 0 ? fullYears / years * 100 : 0;
    const salaryWeight = rows.reduce((sum, row) => sum + row.years * row.percent / 100, 0);
    const averageSalary = salaryWeight > 0
      ? rows.reduce((sum, row) => sum + row.salary * row.years * row.percent / 100, 0) / salaryWeight
      : 0;

    text('historyYears', `${plain(years, 0)} år`);
    text('historyFullYears', `${plain(fullYears, 1)} år`);
    text('historyAveragePercent', `${plain(averagePercent, 0)} %`);
    text('historyAverageSalary', money(averageSalary));
    return { years, fullYears, averagePercent, averageSalary };
  };

  const projectedExtraNav = (inputs, scenario) => {
    if (inputs.futureNavMode === 'none') return 0;
    if (inputs.futureNavMode === 'manual') return inputs.futureNavManual;

    const start = inputs.currentAge;
    const phase = Math.max(start, inputs.phaseStartAge);
    const end = Math.max(phase, inputs.fullRetirementAge);
    const beforePhaseYears = Math.max(0, Math.min(inputs.phaseStartAge, end) - start);
    const phaseYears = Math.max(0, end - Math.max(start, inputs.phaseStartAge));
    const currentIncome = Math.min(NAV_CAP, inputs.currentSalary * inputs.currentWorkPercent / 100);
    let laterPercent = inputs.phaseWorkPercent;
    if (scenario === 'wait') laterPercent = 100;
    if (scenario === 'early') laterPercent = 0;
    const laterIncome = Math.min(NAV_CAP, inputs.currentSalary * laterPercent / 100);
    const addedReserve = currentIncome * 0.181 * beforePhaseYears + laterIncome * 0.181 * phaseYears;
    return addedReserve / Math.max(10, REFERENCE_END_AGE - inputs.fullRetirementAge);
  };

  const pensionModel = (inputs) => {
    const phaseShare = inputs.phasePensionPercent / 100;
    const navAtPhase100 = inputs.navAnnualPhaseExact > 0
      ? inputs.navAnnualPhaseExact
      : inputs.navAnnual67 * ageFactor(inputs.phaseStartAge);
    const phaseNav = navAtPhase100 * phaseShare;
    const selectedExtraNav = projectedExtraNav(inputs, 'phased');
    const earlyExtraNav = projectedExtraNav(inputs, 'early');
    const waitExtraNav = projectedExtraNav(inputs, 'wait');
    const fullNavSelected = phaseNav + inputs.navAnnual67 * ageFactor(inputs.fullRetirementAge) * (1 - phaseShare) + selectedExtraNav;
    const fullNavEarly = navAtPhase100 + earlyExtraNav;
    const fullNavWait = inputs.navAnnual67 * ageFactor(inputs.fullRetirementAge) + waitExtraNav;

    const selectedPrivatePot = futurePrivatePot(inputs, inputs.fullRetirementAge);
    const earlyPrivatePot = futurePrivatePot(inputs, inputs.phaseStartAge);
    const waitPrivatePot = futurePrivatePot(inputs, inputs.fullRetirementAge);
    const selectedPrivateAnnual = annualPayout(selectedPrivatePot, inputs.privateReturnDuring, inputs.privateDuration);
    const earlyPrivateAnnual = annualPayout(earlyPrivatePot, inputs.privateReturnDuring, inputs.privateDuration);
    const waitPrivateAnnual = annualPayout(waitPrivatePot, inputs.privateReturnDuring, inputs.privateDuration);

    return {
      navAtPhase100,
      phaseNav,
      fullNavSelected,
      fullNavEarly,
      fullNavWait,
      selectedExtraNav,
      selectedPrivatePot,
      selectedPrivateAnnual,
      earlyPrivateAnnual,
      waitPrivateAnnual
    };
  };

  const afpAtAge = (inputs, age, scenario) => {
    if (inputs.afpType === 'none' || inputs.afpAnnual <= 0) return 0;
    let startAge = inputs.afpStartAge;
    let annual = inputs.afpAnnual;
    if (scenario === 'wait') {
      if (inputs.afpType === 'public-old') return 0;
      startAge = Math.max(inputs.fullRetirementAge, inputs.afpStartAge);
      const originalFactor = ageFactor(inputs.afpStartAge);
      annual *= ageFactor(startAge) / Math.max(0.01, originalFactor);
    }
    if (age < startAge) return 0;
    if (inputs.afpType === 'public-old' && age >= 67) return 0;
    const temporary = age < 67 ? inputs.afpTemporaryMonthly * 12 : 0;
    return annual + temporary;
  };

  const workplaceAtAge = (inputs, age, scenario) => {
    let startAge = inputs.workplaceStartAge;
    let share = 1;
    if (scenario === 'wait') startAge = Math.max(startAge, inputs.fullRetirementAge);
    if (scenario === 'early') startAge = Math.max(startAge, inputs.phaseStartAge);
    if (age < startAge || age >= startAge + inputs.workplaceDuration) return 0;
    if (scenario === 'phased' && age < inputs.fullRetirementAge) share = inputs.workplacePhasePercent / 100;
    return inputs.workplaceAnnual * share;
  };

  const privateAtAge = (inputs, model, age, scenario) => {
    if (age < inputs.privateStartAge || age >= inputs.privateStartAge + inputs.privateDuration) return 0;
    if (scenario === 'early') return model.earlyPrivateAnnual;
    if (scenario === 'wait') return model.waitPrivateAnnual;
    return model.selectedPrivateAnnual;
  };

  const incomeAtAge = (inputs, model, age, scenario) => {
    let salary = 0;
    let nav = 0;

    if (scenario === 'early') {
      if (age < inputs.phaseStartAge) salary = inputs.currentSalary * inputs.currentWorkPercent / 100;
      if (age >= inputs.phaseStartAge) nav = model.fullNavEarly;
    } else if (scenario === 'wait') {
      if (age < inputs.fullRetirementAge) salary = inputs.currentSalary;
      if (age >= inputs.fullRetirementAge) nav = model.fullNavWait;
    } else {
      if (age < inputs.phaseStartAge) salary = inputs.currentSalary * inputs.currentWorkPercent / 100;
      else if (age < inputs.fullRetirementAge) salary = inputs.currentSalary * inputs.phaseWorkPercent / 100;

      if (age >= inputs.phaseStartAge && age < inputs.fullRetirementAge) nav = model.phaseNav;
      if (age >= inputs.fullRetirementAge) nav = model.fullNavSelected;
    }

    const afp = afpAtAge(inputs, age, scenario);
    if (inputs.afpType === 'public-old' && age < 67 && afp > 0) nav = 0;
    const workplace = workplaceAtAge(inputs, age, scenario);
    const privatePension = privateAtAge(inputs, model, age, scenario);
    const other = age >= (scenario === 'early' ? inputs.phaseStartAge : inputs.fullRetirementAge) ? inputs.otherAnnual : 0;
    const pension = nav + afp + workplace + privatePension + other;
    const gross = salary + pension;
    const net = salary * (1 - inputs.salaryTaxRate / 100) + pension * (1 - inputs.pensionTaxRate / 100);
    return { salary, nav, afp, workplace, privatePension, other, pension, gross, net };
  };

  const scenarioSeries = (inputs, model, scenario) => {
    const startAge = Math.max(50, Math.floor(inputs.currentAge));
    const endAge = Math.max(startAge + 1, Math.floor(inputs.lifeAge));
    const series = [];
    for (let age = startAge; age < endAge; age += 1) {
      series.push({ age, ...incomeAtAge(inputs, model, age, scenario) });
    }
    return series;
  };

  const sumNet = (series) => series.reduce((sum, year) => sum + year.net, 0);

  const warnings = (inputs) => {
    const messages = [];
    if (inputs.navAnnual67 <= 0) messages.push('Legg inn årsbeløpet fra NAV for å få et meningsfullt resultat.');
    if (inputs.phaseStartAge < inputs.currentAge) messages.push('Startalderen ligger før alderen din nå. Beregningen viser derfor planen som om den starter umiddelbart.');
    if (inputs.fullRetirementAge <= inputs.phaseStartAge) messages.push('Sluttalderen må være høyere enn startalderen for å vise en nedtrappingsperiode.');
    if (inputs.lifeAge <= inputs.fullRetirementAge) messages.push('Alderen du regner frem til må være høyere enn alderen for full pensjon.');
    if (inputs.afpType === 'private' && inputs.phaseStartAge < 67 && inputs.phasePensionPercent < 20 && inputs.afpAnnual > 0) {
      messages.push('Privat AFP før 67 år krever normalt at du samtidig kan ta ut minst 20 prosent alderspensjon. Kontroller dette hos NAV.');
    }
    if (inputs.afpType === 'public-old' && inputs.birthYear >= 1963) messages.push('Gammel offentlig AFP gjelder normalt personer født i 1962 eller tidligere.');
    if (inputs.afpType === 'public-new' && inputs.birthYear <= 1962) messages.push('Livsvarig offentlig AFP gjelder normalt personer født i 1963 eller senere.');
    if (inputs.afpType === 'public-old' && inputs.phaseStartAge < 67 && inputs.phasePensionPercent > 0) {
      messages.push('Offentlig AFP etter gammel ordning kan ikke tas samtidig med alderspensjon fra folketrygden før 67 år. Regninga setter derfor folketrygden til 0 i disse årene.');
    }
    if (inputs.futureNavMode === 'auto') {
      messages.push('Ekstra NAV-opptjening er et grovt anslag etter nye opptjeningsregler. Slå det av dersom NAV-beløpet ditt allerede forutsetter videre arbeid.');
      if (inputs.birthYear <= 1962) messages.push('Du er i et overgangsårskull. Automatisk ekstraopptjening er særlig usikker og bør erstattes med et NAV-beløp.');
    }
    if (inputs.privateReturn > 6 || inputs.privateReturnDuring > 5) messages.push('Avkastningsforutsetningen er høy. Se også et scenario med lavere avkastning.');
    if (messages.length === 0) messages.push('Ingen åpenbare kombinasjonsfeil er funnet. Kontroller likevel AFP, tjenestepensjon og skatt hos de offisielle aktørene.');
    return messages;
  };

  let chartState = null;

  const drawChart = (series) => {
    const canvas = el('pensionChart');
    if (!canvas || series.length === 0) return;
    const parentWidth = Math.max(320, canvas.parentElement?.clientWidth || 720);
    const cssWidth = Math.min(900, parentWidth - 2);
    const cssHeight = Math.max(300, Math.min(420, cssWidth * 0.53));
    const ratio = window.devicePixelRatio || 1;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    const pad = { left: 62, right: 18, top: 24, bottom: 42 };
    const width = cssWidth - pad.left - pad.right;
    const height = cssHeight - pad.top - pad.bottom;
    const maxValue = Math.max(100000, ...series.map((row) => row.gross));
    const roundedMax = Math.ceil(maxValue / 100000) * 100000;
    const x = (index) => pad.left + (series.length === 1 ? width / 2 : index / (series.length - 1) * width);
    const y = (amount) => pad.top + height - amount / roundedMax * height;

    context.font = '12px system-ui, sans-serif';
    context.textBaseline = 'middle';
    context.lineWidth = 1;
    for (let step = 0; step <= 4; step += 1) {
      const amount = roundedMax * step / 4;
      const yPos = y(amount);
      context.strokeStyle = 'rgba(255,255,255,.09)';
      context.beginPath(); context.moveTo(pad.left, yPos); context.lineTo(cssWidth - pad.right, yPos); context.stroke();
      context.fillStyle = 'rgba(164,175,193,.8)';
      context.textAlign = 'right';
      context.fillText(compactMoney(amount).replace(' kr', ''), pad.left - 9, yPos);
    }

    const tickEvery = series.length > 20 ? 3 : series.length > 12 ? 2 : 1;
    series.forEach((row, index) => {
      if (index % tickEvery !== 0 && index !== series.length - 1) return;
      context.fillStyle = 'rgba(164,175,193,.82)';
      context.textAlign = 'center';
      context.fillText(String(row.age), x(index), cssHeight - 18);
    });

    const drawLine = (key, color, lineWidth) => {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.beginPath();
      series.forEach((row, index) => {
        const xPos = x(index);
        const yPos = y(row[key]);
        if (index === 0) context.moveTo(xPos, yPos); else context.lineTo(xPos, yPos);
      });
      context.stroke();
    };

    drawLine('salary', '#59d9ff', 3);
    drawLine('pension', '#a78bfa', 3);
    drawLine('gross', '#a8ff5f', 4);

    chartState = { series, pad, width, height, cssWidth, cssHeight, roundedMax, x, y };
    canvas.setAttribute('aria-label', `Graf fra ${series[0].age} til ${series[series.length - 1].age} år. Bruttoinntekten etter full pensjon er omtrent ${money(series.find((row) => row.salary === 0)?.gross || series[series.length - 1].gross)} per år.`);
  };

  const updateResults = () => {
    const inputs = readInputs();
    const history = historySummary();
    const model = pensionModel(inputs);
    text('ageHelp', `Du er omtrent ${plain(inputs.currentAge)} år i ${CURRENT_YEAR}.`);

    const phaseAge = Math.max(inputs.currentAge, inputs.phaseStartAge);
    const fullAge = Math.max(phaseAge, inputs.fullRetirementAge);
    const phaseIncome = incomeAtAge(inputs, model, Math.min(fullAge - 0.01, phaseAge), 'phased');
    const fullIncome = incomeAtAge(inputs, model, fullAge, 'phased');

    text('pensionMainResult', money(fullIncome.net / 12));
    text('pensionMainSub', `${money(fullIncome.gross / 12)} brutto per måned ved ${plain(fullAge)} år`);
    text('phaseNetMonthly', money(phaseIncome.net / 12));
    text('phaseGrossMonthly', `${money(phaseIncome.gross / 12)} brutto`);
    text('fullNetMonthly', money(fullIncome.net / 12));
    text('fullGrossMonthly', `${money(fullIncome.gross / 12)} brutto`);
    text('navResult', `${money(fullIncome.nav / 12)} / mnd.`);
    text('afpResult', `${money(fullIncome.afp / 12)} / mnd.`);
    text('workplaceResult', `${money(fullIncome.workplace / 12)} / mnd.`);
    text('privateResult', `${money(fullIncome.privatePension / 12)} / mnd.`);
    const currentActualSalary = inputs.currentSalary * inputs.currentWorkPercent / 100;
    const replacement = currentActualSalary > 0 ? fullIncome.gross / currentActualSalary * 100 : 0;
    text('replacementResult', `${plain(replacement, 0)} %`);

    const selectedSeries = scenarioSeries(inputs, model, 'phased');
    const earlySeries = scenarioSeries(inputs, model, 'early');
    const waitSeries = scenarioSeries(inputs, model, 'wait');
    const totals = {
      early: sumNet(earlySeries),
      phased: sumNet(selectedSeries),
      wait: sumNet(waitSeries)
    };

    const earlyAtFull = incomeAtAge(inputs, model, fullAge, 'early');
    const waitAtFull = incomeAtAge(inputs, model, fullAge, 'wait');
    text('scenarioEarlyTotal', money(totals.early));
    text('scenarioPhasedTotal', money(totals.phased));
    text('scenarioWaitTotal', money(totals.wait));
    text('scenarioEarlyMonthly', `${money(earlyAtFull.net / 12)} netto per måned etter ${plain(fullAge)} år`);
    text('scenarioPhasedMonthly', `${money(fullIncome.net / 12)} netto per måned etter ${plain(fullAge)} år`);
    text('scenarioWaitMonthly', `${money(waitAtFull.net / 12)} netto per måned etter ${plain(fullAge)} år`);

    const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const labels = { early: 'Tidlig full pensjon', phased: 'Gradert overgang', wait: 'Full jobb og senere uttak' };
    const difference = ranked[0][1] - ranked[ranked.length - 1][1];
    text('bestScenarioHeading', `${labels[ranked[0][0]]} gir høyest sum i dette anslaget.`);
    text('bestScenarioText', `Frem til ${plain(inputs.lifeAge)} år er forskjellen mellom høyeste og laveste scenario omtrent ${money(difference)} etter den enkle skatteberegningen. Dette sier ikke hvilket valg som er best for helse, fritid eller risiko.`);
    text('scenarioDifference', money(difference));

    const warningMessages = warnings(inputs);
    const warningNode = el('pensionWarnings');
    if (warningNode) warningNode.innerHTML = warningMessages.map((message) => `<span>${message}</span>`).join('');

    drawChart(selectedSeries);
    persist();

    window.__regningaPensionResult = {
      inputs, history, model, phaseIncome, fullIncome, totals, warningMessages
    };
  };

  const persist = () => {
    const data = {};
    form.querySelectorAll('input, select').forEach((node) => {
      if (node.id) data[node.id] = node.value;
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  };

  const restore = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.entries(data).forEach(([id, savedValue]) => {
        const node = el(id);
        if (node) node.value = savedValue;
      });
    } catch (_) {
      // Gamle eller ugyldige data ignoreres.
    }
  };

  const updateConditionalFields = () => {
    const mode = el('futureNavMode')?.value;
    const manual = el('futureNavManual');
    if (manual) {
      manual.disabled = mode !== 'manual';
      manual.closest('.field')?.classList.toggle('field-disabled', mode !== 'manual');
    }
  };

  form.addEventListener('input', () => {
    updateConditionalFields();
    updateResults();
  });
  form.addEventListener('change', () => {
    updateConditionalFields();
    updateResults();
  });

  el('recalculateButton')?.addEventListener('click', updateResults);
  el('resetPension')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    updateConditionalFields();
    updateResults();
  });
  el('printPension')?.addEventListener('click', () => window.print());
  el('copyPension')?.addEventListener('click', async (event) => {
    const result = window.__regningaPensionResult;
    if (!result) return;
    const summary = [
      'Pensjonsscenario fra Regninga',
      `Nedtrapping: ${money(result.phaseIncome.net / 12)} netto per måned.`,
      `Full pensjon: ${money(result.fullIncome.net / 12)} netto per måned.`,
      `Folketrygd: ${money(result.fullIncome.nav / 12)} per måned.`,
      `AFP: ${money(result.fullIncome.afp / 12)} per måned.`,
      `Tjenestepensjon: ${money(result.fullIncome.workplace / 12)} per måned.`,
      `Egen pensjon: ${money(result.fullIncome.privatePension / 12)} per måned.`,
      'Veiledende anslag – kontroller beløpene hos NAV og pensjonsleverandør.'
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      const old = event.currentTarget.textContent;
      event.currentTarget.textContent = 'Kopiert!';
      setTimeout(() => { event.currentTarget.textContent = old; }, 1500);
    } catch (_) {
      window.prompt('Kopier oppsummeringen:', summary);
    }
  });

  const canvas = el('pensionChart');
  const tooltip = el('chartTooltip');
  canvas?.addEventListener('mousemove', (event) => {
    if (!chartState || !tooltip) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const rawIndex = (mouseX - chartState.pad.left) / chartState.width * (chartState.series.length - 1);
    const index = clamp(Math.round(rawIndex), 0, chartState.series.length - 1);
    const row = chartState.series[index];
    tooltip.hidden = false;
    tooltip.innerHTML = `<strong>${row.age} år</strong><span>Arbeid: ${money(row.salary)}</span><span>Pensjon: ${money(row.pension)}</span><span>Totalt: ${money(row.gross)}</span>`;
    tooltip.style.left = `${clamp(mouseX, 92, rect.width - 92)}px`;
    tooltip.style.top = `${clamp(event.clientY - rect.top - 92, 8, rect.height - 112)}px`;
  });
  canvas?.addEventListener('mouseleave', () => { if (tooltip) tooltip.hidden = true; });
  window.addEventListener('resize', () => {
    const inputs = readInputs();
    const model = pensionModel(inputs);
    drawChart(scenarioSeries(inputs, model, 'phased'));
  });

  restore();
  updateConditionalFields();
  updateResults();
})();
