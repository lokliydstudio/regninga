(() => {
  'use strict';
  const type = document.body.dataset.newCalculator;
  const form = document.querySelector('[data-new-calculator-form]');
  if (!type || !form) return;

  const money = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
  const monthName = new Intl.DateTimeFormat('nb-NO', { month: 'long', year: 'numeric' });
  const el = id => document.getElementById(id);
  const value = id => Math.max(0, Number(el(id)?.value) || 0);
  const signed = id => Number(el(id)?.value) || 0;
  const kr = number => `${money.format(Math.round(number))} kr`;
  const set = (id, text) => { if (el(id)) el(id).textContent = text; };

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
  function duration(months) {
    const years = Math.floor(months / 12), rest = months % 12;
    return [years ? `${years} år` : '', rest ? `${rest} mnd` : ''].filter(Boolean).join(' ') || '0 mnd';
  }
  function debtFree() {
    const debt = value('debt');
    const annual = value('interest');
    const payment = value('payment');
    const extra = value('extra');
    const base = payoff(debt, annual, payment);
    const fast = payoff(debt, annual, payment + extra);
    const warning = el('warning');
    if (!base || !fast) {
      set('resultTitle', 'Øk månedsbeløpet');
      set('resultSummary', 'Betalingen må være høyere enn rentene som påløper hver måned.');
      set('primaryResult', 'Ikke nedbetalt');
      ['fastTime','baseTime','savedInterest','savedMonths'].forEach(id => set(id, '–'));
      if (warning) { warning.style.display = 'block'; warning.textContent = 'Prøv et høyere månedsbeløp, slik at gjelden faktisk reduseres.'; }
      return;
    }
    if (warning) warning.style.display = 'none';
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

  const calculators = { 'leie-eller-kjope': rentOrBuy, 'flytte-hjemmefra': movingOut, 'gjeldsfri': debtFree };
  const calculate = calculators[type];
  if (!calculate) return;

  if (type === 'gjeldsfri' && el('startDate') && !el('startDate').value) {
    el('startDate').value = new Date().toISOString().slice(0, 7);
  }
  form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
  form.addEventListener('input', calculate);
  const reset = document.querySelector('[data-reset-calculator]');
  if (reset) reset.addEventListener('click', () => {
    form.reset();
    if (type === 'gjeldsfri' && el('startDate')) el('startDate').value = new Date().toISOString().slice(0, 7);
    calculate();
  });
  calculate();
})();
