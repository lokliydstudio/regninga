(() => {
  'use strict';
  const type = document.body.dataset.newCalculator;
  const form = document.querySelector('[data-new-calculator-form]');
  if (!type || !form) return;

  const money = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 });
  const monthName = new Intl.DateTimeFormat('nb-NO', { month: 'long', year: 'numeric' });
  const el = id => document.getElementById(id);
  const value = id => Math.max(0, Number(el(id)?.value) || 0);
  const signed = id => Number(el(id)?.value) || 0;
  const kr = number => `${money.format(Math.round(number))} kr`;
  const set = (id, text) => { if (el(id)) el(id).textContent = text; };
  const warning = text => {
    const target = el('warning');
    if (!target) return;
    target.style.display = text ? 'block' : 'none';
    target.textContent = text || '';
  };
  const duration = months => {
    const safe = Math.max(0, Math.round(months));
    const years = Math.floor(safe / 12), rest = safe % 12;
    return [years ? `${years} år` : '', rest ? `${rest} mnd` : ''].filter(Boolean).join(' ') || '0 mnd';
  };
  const annuityPayment = (principal, annualRate, years) => {
    if (principal <= 0) return 0;
    const months = Math.max(1, Math.round(years * 12));
    const rate = annualRate / 100 / 12;
    if (rate === 0) return principal / months;
    return principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
  };
  const loanFromPayment = (payment, annualRate, years) => {
    if (payment <= 0) return 0;
    const months = Math.max(1, Math.round(years * 12));
    const rate = annualRate / 100 / 12;
    if (rate === 0) return payment * months;
    return payment * (1 - Math.pow(1 + rate, -months)) / rate;
  };
  const loanInterest = (principal, annualRate, years) => {
    const months = Math.max(1, Math.round(years * 12));
    return Math.max(0, annuityPayment(principal, annualRate, years) * months - principal);
  };

  function rentOrBuy() {
    const rent = value('rent');
    const rentGrowth = value('rentGrowth') / 100;
    const price = value('price');
    const equity = Math.min(value('equity'), price);
    const monthlyRate = value('interest') / 100 / 12;
    const loanYears = Math.max(1, value('loanYears'));
    const running = value('running');
    const maintenance = value('maintenance');
    const buyCosts = value('buyCosts');
    const growth = signed('growth') / 100;
    const horizon = Math.max(1, value('horizon'));
    const loan = Math.max(0, price - equity);
    const term = Math.max(1, Math.round(loanYears * 12));
    const months = Math.max(1, Math.round(horizon * 12));
    const payment = loan === 0 ? 0 : (monthlyRate === 0 ? loan / term : loan * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1));

    let balance = loan, totalPayments = 0, totalRent = 0, currentRent = rent;
    for (let month = 0; month < months; month += 1) {
      if (month > 0 && month % 12 === 0) currentRent *= 1 + rentGrowth;
      totalRent += currentRent;
      if (balance > .01) {
        const interestPart = balance * monthlyRate;
        const paid = Math.min(payment, balance + interestPart);
        const principal = Math.max(0, paid - interestPart);
        balance = Math.max(0, balance - principal);
        totalPayments += paid;
      }
    }
    const homeValue = price * Math.pow(1 + growth, horizon);
    const endEquity = homeValue - balance;
    const ownerRunning = (running + maintenance) * months;
    const buyNet = equity + buyCosts + totalPayments + ownerRunning - endEquity;
    const difference = totalRent - buyNet;
    const buyWins = difference > 0;
    const monthlyDifference = Math.abs(difference) / months;

    set('resultTitle', buyWins ? 'Kjøp ser billigst ut' : 'Leie ser billigst ut');
    set('resultSummary', `${buyWins ? 'Kjøp' : 'Leie'} er omtrent ${kr(monthlyDifference)} billigere per måned over ${horizon} år med disse forutsetningene.`);
    set('primaryResult', kr(monthlyDifference));
    set('rentCost', kr(totalRent));
    set('buyCost', kr(buyNet));
    set('buyMonthly', kr(payment + running + maintenance));
    set('endEquity', kr(endEquity));
    warning('');
  }

  function movingOut() {
    const income = value('income');
    const savings = value('savings');
    const rent = value('rent');
    const monthly = ['electricity','food','transport','internet','insurance','subscriptions','other']
      .reduce((sum, id) => sum + value(id), rent);
    const left = income - monthly;
    const startup = value('deposit') + value('furniture') + value('moving') + rent;
    const missing = Math.max(0, startup - savings);
    const share = income > 0 ? monthly / income : 0;

    set('resultTitle', left >= 0 ? 'Budsjettet går rundt' : 'Utgiftene er for høye');
    set('resultSummary', left >= 0
      ? `Du har omtrent ${kr(left)} igjen hver måned etter de oppgitte utgiftene.`
      : `Du mangler omtrent ${kr(Math.abs(left))} hver måned. Juster utgiftene eller inntekten før du flytter.`);
    set('primaryResult', `${kr(monthly)} / mnd`);
    set('leftAfter', kr(left));
    set('startupCost', kr(startup));
    set('savingsGap', missing > 0 ? kr(missing) : 'Dekket');
    set('incomeShare', `${Math.round(share * 100)} %`);
    warning(left < 0 ? 'Månedsutgiftene er høyere enn inntekten med disse tallene.' : '');
  }

  function payoff(debt, annualRate, payment) {
    if (debt <= 0) return { months: 0, interest: 0 };
    const rate = annualRate / 100 / 12;
    if (payment <= debt * rate) return null;
    let balance = debt, months = 0, totalInterest = 0;
    while (balance > .01 && months < 1200) {
      const interest = balance * rate;
      const paid = Math.min(payment, balance + interest);
      balance -= Math.max(0, paid - interest);
      totalInterest += interest;
      months += 1;
    }
    return months >= 1200 ? null : { months, interest: totalInterest };
  }

  function debtFree() {
    const debt = value('debt');
    const annual = value('interest');
    const payment = value('payment');
    const extra = value('extra');
    const base = payoff(debt, annual, payment);
    const fast = payoff(debt, annual, payment + extra);
    if (!base || !fast) {
      set('resultTitle', 'Øk månedsbeløpet');
      set('resultSummary', 'Betalingen må være høyere enn rentene som påløper hver måned.');
      set('primaryResult', 'Ikke nedbetalt');
      ['fastTime','baseTime','savedInterest','savedMonths'].forEach(id => set(id, '–'));
      warning('Prøv et høyere månedsbeløp, slik at gjelden faktisk reduseres.');
      return;
    }
    warning('');
    const raw = el('startDate').value;
    const start = raw ? new Date(`${raw}-01T12:00:00`) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + fast.months);
    const savedMonths = Math.max(0, base.months - fast.months);
    set('resultTitle', debt <= 0 ? 'Du er allerede gjeldsfri' : `Gjeldsfri ${monthName.format(end)}`);
    set('resultSummary', debt <= 0 ? 'Ingen gjeld å betale ned.' : `Med ${kr(payment + extra)} per måned kan du bli ferdig omtrent ${duration(savedMonths)} tidligere.`);
    set('primaryResult', duration(fast.months));
    set('fastTime', duration(fast.months));
    set('baseTime', duration(base.months));
    set('savedInterest', kr(Math.max(0, base.interest - fast.interest)));
    set('savedMonths', `${savedMonths} måneder`);
  }

  function bufferCalculator() {
    const essentials = value('essential');
    const months = value('coverageMonths');
    const extras = value('homeReserve') + value('carReserve') + value('dependentsReserve') + value('otherReserve');
    const recommended = essentials * months + extras;
    const current = value('currentBuffer');
    const saving = value('monthlySaving');
    const gap = Math.max(0, recommended - current);
    const savingMonths = gap === 0 ? 0 : (saving > 0 ? Math.ceil(gap / saving) : null);
    const coverage = essentials > 0 ? current / essentials : 0;

    set('resultTitle', gap === 0 ? 'Buffermålet er nådd' : 'Et tydelig buffermål');
    set('resultSummary', gap === 0
      ? `Dagens buffer dekker målet med de valgte forutsetningene.`
      : `Du mangler omtrent ${kr(gap)}. Med dagens sparing tar det ${savingMonths === null ? 'ukjent tid' : duration(savingMonths)}.`);
    set('primaryResult', kr(recommended));
    set('bufferGap', gap ? kr(gap) : 'Målet er nådd');
    set('currentCoverage', `${decimal.format(coverage)} måneder`);
    set('savingTime', savingMonths === null ? 'Legg inn sparing' : duration(savingMonths));
    set('extraReserve', kr(extras));
    warning(gap > 0 && saving === 0 ? 'Legg inn månedlig sparing for å få beregnet tid til målet.' : '');
  }

  function subscriptions() {
    const ids = ['streaming','music','news','games','mobile','internet','gym','cloud','subscriptionOther'];
    const total = ids.reduce((sum, id) => sum + value(id), 0);
    const cuts = Math.min(total, value('plannedCuts'));
    const after = total - cuts;
    set('resultTitle', total > 0 ? 'Små trekk blir fort store' : 'Ingen abonnementer registrert');
    set('resultSummary', cuts > 0 ? `Planlagte kutt kan frigjøre ${kr(cuts * 12)} i året.` : 'Legg inn abonnementene dine for å se totalen.');
    set('primaryResult', `${kr(total)} / mnd`);
    set('subscriptionYear', kr(total * 12));
    set('afterCuts', `${kr(after)} / mnd`);
    set('cutSavingYear', kr(cuts * 12));
    set('subscriptionDay', `${kr(total * 12 / 365)} / dag`);
    warning(value('plannedCuts') > total && total > 0 ? 'Planlagte kutt er høyere enn den samlede abonnementskostnaden og er derfor begrenset til totalen.' : '');
  }

  function foodBudget() {
    const groceryMonth = value('groceriesWeekly') * 52 / 12;
    const lunchMonth = value('lunchWeekly') * 52 / 12;
    const total = groceryMonth + lunchMonth + value('takeawayMonthly');
    const people = Math.max(1, value('adults') + value('children'));
    const waste = groceryMonth * Math.min(100, value('foodWastePct')) / 100;
    const target = total * (1 - Math.min(100, value('foodReductionPct')) / 100);
    set('resultTitle', 'Matkostnaden samlet på ett sted');
    set('resultSummary', `Budsjettet tilsvarer omtrent ${kr(total / people)} per person hver måned.`);
    set('primaryResult', `${kr(total)} / mnd`);
    set('foodYear', kr(total * 12));
    set('foodPerPerson', `${kr(total / people)} / mnd`);
    set('foodWaste', `${kr(waste)} / mnd`);
    set('foodTarget', `${kr(target)} / mnd`);
    warning('');
  }

  function newJob() {
    const days = value('workdays');
    const oldValue = value('oldNet') + value('oldBenefits') - value('oldCommuteCost') - value('oldOtherJobCost');
    const newValue = value('newNet') + value('newBenefits') - value('newCommuteCost') - value('newOtherJobCost');
    const difference = newValue - oldValue;
    const oldTime = value('oldHours') * 52 / 12 + value('oldCommuteMinutes') * days / 60;
    const newTime = value('newHours') * 52 / 12 + value('newCommuteMinutes') * days / 60;
    const timeSaved = oldTime - newTime;
    const oldHourly = oldTime > 0 ? oldValue / oldTime : 0;
    const newHourly = newTime > 0 ? newValue / newTime : 0;
    const hourlyDiff = newHourly - oldHourly;
    const moneyWord = difference >= 0 ? 'mer' : 'mindre';
    const timeText = timeSaved >= 0 ? `${decimal.format(timeSaved)} timer mer fritid` : `${decimal.format(Math.abs(timeSaved))} timer mindre fritid`;

    set('resultTitle', difference >= 0 ? 'Den nye jobben gir mer igjen' : 'Den nye jobben gir mindre igjen');
    set('resultSummary', `Den nye jobben gir omtrent ${kr(Math.abs(difference))} ${moneyWord} per måned og ${timeText}.`);
    set('primaryResult', `${difference >= 0 ? '+' : '−'} ${kr(Math.abs(difference))}`);
    set('oldJobValue', `${kr(oldValue)} / mnd`);
    set('newJobValue', `${kr(newValue)} / mnd`);
    set('timeDifference', `${timeSaved >= 0 ? '+' : '−'} ${decimal.format(Math.abs(timeSaved))} t/mnd`);
    set('hourlyDifference', `${hourlyDiff >= 0 ? '+' : '−'} ${kr(Math.abs(hourlyDiff))} / time`);
    warning('');
  }

  function renovation() {
    const base = value('renovationMaterials') + value('renovationLabor') + value('renovationFixtures') + value('renovationPermits') + value('renovationOther');
    const contingency = base * Math.min(100, value('renovationContingency')) / 100;
    const total = base + contingency;
    const loan = Math.max(0, total - value('renovationFunds'));
    const years = Math.max(1, value('renovationYears'));
    const annual = value('renovationInterest');
    const payment = annuityPayment(loan, annual, years);
    const interest = loanInterest(loan, annual, years);
    set('resultTitle', loan > 0 ? 'Prosjektet trenger finansiering' : 'Egne midler dekker prosjektet');
    set('resultSummary', loan > 0 ? `Et lånebehov på ${kr(loan)} gir omtrent ${kr(payment)} i månedlig betaling.` : 'De oppgitte egne midlene dekker estimert prosjektpris.');
    set('primaryResult', kr(total));
    set('renovationBuffer', kr(contingency));
    set('renovationLoan', loan ? kr(loan) : 'Ikke nødvendig');
    set('renovationPayment', loan ? `${kr(payment)} / mnd` : '0 kr');
    set('renovationInterestTotal', loan ? kr(interest) : '0 kr');
    warning('');
  }

  function affordableHome() {
    const income = value('homeNetIncome');
    const debt = value('homeDebtPayments');
    const living = value('homeLivingCosts');
    const desired = value('homeDesiredLeft');
    const running = value('homeRunningCosts');
    const paymentBudget = income - debt - living - desired - running;
    const annual = value('homeInterest');
    const years = Math.max(1, value('homeLoanYears'));
    const equity = value('homeEquity');
    if (paymentBudget <= 0) {
      set('resultTitle', 'Det er ikke rom for et nytt boliglån');
      set('resultSummary', 'De valgte utgiftene og ønsket beløp igjen bruker hele månedsinntekten.');
      set('primaryResult', kr(equity));
      set('homeLoanEstimate', '0 kr');
      set('homePaymentBudget', '0 kr');
      set('homeStressPayment', '–');
      set('homeStressLeft', kr(income - debt - living - running));
      warning('Juster utgifter eller ønsket beløp igjen for å beregne et lånebeløp.');
      return;
    }
    const loan = loanFromPayment(paymentBudget, annual, years);
    const price = loan + equity;
    const stressPayment = annuityPayment(loan, annual + value('homeStressAdd'), years);
    const stressLeft = income - debt - living - running - stressPayment;
    set('resultTitle', 'Et komfortabelt prisanslag');
    set('resultSummary', `Med ${kr(paymentBudget)} tilgjengelig til lånet per måned blir anslått boligpris omtrent ${kr(price)}.`);
    set('primaryResult', kr(price));
    set('homeLoanEstimate', kr(loan));
    set('homePaymentBudget', `${kr(paymentBudget)} / mnd`);
    set('homeStressPayment', `${kr(stressPayment)} / mnd`);
    set('homeStressLeft', `${kr(stressLeft)} / mnd`);
    warning(stressLeft < desired ? 'Ved stresstesten blir beløpet igjen lavere enn ønsket. Vurder et lavere prisnivå.' : '');
  }

  function wedding() {
    const guests = value('weddingGuests');
    const variable = guests * (value('weddingFood') + value('weddingDrinks'));
    const fixed = value('weddingVenue') + value('weddingAttire') + value('weddingPhoto') + value('weddingMusic') + value('weddingDecor') + value('weddingRings') + value('weddingTravel') + value('weddingOther');
    const base = fixed + variable;
    const buffer = base * Math.min(100, value('weddingContingency')) / 100;
    const total = base + buffer;
    const remaining = Math.max(0, total - value('weddingSavings'));
    const months = Math.max(1, value('weddingMonths'));
    set('resultTitle', remaining > 0 ? 'En konkret spareplan' : 'Bryllupet er finansiert');
    set('resultSummary', remaining > 0 ? `Dere må spare omtrent ${kr(remaining / months)} per måned frem til bryllupet.` : 'Oppspart beløp dekker det estimerte budsjettet.');
    set('primaryResult', kr(total));
    set('weddingPerGuest', guests > 0 ? kr(total / guests) : '–');
    set('weddingBuffer', kr(buffer));
    set('weddingRemaining', remaining ? kr(remaining) : 'Dekket');
    set('weddingMonthlySaving', remaining ? `${kr(remaining / months)} / mnd` : '0 kr');
    warning('');
  }

  function tripBudget() {
    const travelers = Math.max(1, value('tripTravelers'));
    const accommodation = value('tripNights') * value('tripNightPrice');
    const food = travelers * value('tripDays') * value('tripFoodDay');
    const activities = travelers * value('tripActivities');
    const base = value('tripTransport') + accommodation + food + activities + value('tripLocal') + value('tripShopping');
    const buffer = base * Math.min(100, value('tripBufferPct')) / 100;
    const total = base + buffer;
    const remaining = Math.max(0, total - value('tripSavings'));
    const months = Math.max(1, value('tripMonths'));
    set('resultTitle', remaining > 0 ? 'Ferien har en tydelig prislapp' : 'Ferien er finansiert');
    set('resultSummary', remaining > 0 ? `Spar omtrent ${kr(remaining / months)} per måned for å dekke budsjettet.` : 'Oppspart beløp dekker det estimerte feriebudsjettet.');
    set('primaryResult', kr(total));
    set('tripPerPerson', kr(total / travelers));
    set('tripBuffer', kr(buffer));
    set('tripRemaining', remaining ? kr(remaining) : 'Dekket');
    set('tripMonthlySaving', remaining ? `${kr(remaining / months)} / mnd` : '0 kr');
    warning('');
  }

  function newOrUsed() {
    const years = Math.max(1, value('compareYears'));
    const annual = value('compareInterest');
    const down = value('compareDownPayment');
    const newPrice = value('compareNewPrice');
    const usedPrice = value('compareUsedPrice');
    const newLoan = Math.max(0, newPrice - Math.min(down, newPrice));
    const usedLoan = Math.max(0, usedPrice - Math.min(down, usedPrice));
    const newInterest = loanInterest(newLoan, annual, years);
    const usedInterest = loanInterest(usedLoan, annual, years);
    const newTotal = Math.max(0, newPrice - value('compareNewResale')) + years * (value('compareNewMaintenance') + value('compareNewInsurance')) + value('compareNewFees') + newInterest;
    const usedTotal = Math.max(0, usedPrice - value('compareUsedResale')) + years * (value('compareUsedMaintenance') + value('compareUsedInsurance')) + value('compareUsedFees') + usedInterest;
    const diff = newTotal - usedTotal;
    const usedWins = diff > 0;
    const label = usedWins ? 'Brukt' : 'Nytt';
    set('resultTitle', `${label} ser billigst ut`);
    set('resultSummary', `${label} er omtrent ${kr(Math.abs(diff) / (years * 12))} billigere per måned over ${years} år.`);
    set('primaryResult', kr(Math.abs(diff)));
    set('compareNewTotal', kr(newTotal));
    set('compareUsedTotal', kr(usedTotal));
    set('compareMonthlyDiff', `${kr(Math.abs(diff) / (years * 12))} / mnd`);
    set('compareInterestDiff', kr(Math.abs(newInterest - usedInterest)));
    warning('');
  }

  function insuranceCheck() {
    const ids = ['insuranceHome','insuranceTravel','insuranceCar','insurancePet','insuranceLife','insuranceDevice','insurancePayment','insuranceOther'];
    const total = ids.reduce((sum, id) => sum + value(id), 0);
    const overlap = Math.min(total, value('insuranceOverlap'));
    const after = total - overlap;
    const deductible = value('insuranceDeductible');
    const buffer = value('insuranceBuffer');
    const covered = buffer >= deductible;
    set('resultTitle', covered ? 'Bufferen dekker egenandelen' : 'Egenandelen er større enn bufferen');
    set('resultSummary', overlap > 0 ? `Du har merket ${kr(overlap)} per måned som mulig overlapp å undersøke.` : 'Du har ikke lagt inn mulig overlapp.');
    set('primaryResult', `${kr(total)} / mnd`);
    set('insuranceYear', kr(total * 12));
    set('insuranceAfterReview', `${kr(after)} / mnd`);
    set('insuranceSaving', kr(overlap * 12));
    set('insuranceDeductibleStatus', covered ? `${kr(buffer - deductible)} i margin` : `${kr(deductible - buffer)} mangler`);
    warning(!covered ? 'Vurder om bufferen bør økes, men ikke endre forsikringer uten å kontrollere vilkår og dekning.' : '');
  }

  const calculators = {
    'leie-eller-kjope': rentOrBuy,
    'flytte-hjemmefra': movingOut,
    'gjeldsfri': debtFree,
    'buffer': bufferCalculator,
    'abonnementssjekken': subscriptions,
    'matbudsjett': foodBudget,
    'ny-jobb': newJob,
    'oppussing': renovation,
    'hvor-mye-bolig': affordableHome,
    'bryllup': wedding,
    'feriebudsjett': tripBudget,
    'nytt-eller-brukt': newOrUsed,
    'forsikringssjekken': insuranceCheck
  };
  const calculate = calculators[type];
  if (!calculate) return;

  if (type === 'gjeldsfri' && el('startDate') && !el('startDate').value) {
    el('startDate').value = new Date().toISOString().slice(0, 7);
  }
  form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  const reset = document.querySelector('[data-reset-calculator]');
  if (reset) reset.addEventListener('click', () => {
    form.reset();
    if (type === 'gjeldsfri' && el('startDate')) el('startDate').value = new Date().toISOString().slice(0, 7);
    calculate();
  });
  calculate();
})();
