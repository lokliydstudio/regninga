(() => {
  'use strict';

  const form = document.getElementById('rentesjekkenForm');
  const offerList = document.getElementById('offerList');
  const template = document.getElementById('offerTemplate');
  if (!form || !offerList || !template) return;

  const money = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number = id => Math.max(0, Number(document.getElementById(id)?.value) || 0);
  const text = id => (document.getElementById(id)?.value || '').trim();
  const clean = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  const defaults = [
    { name: 'Eksempeltilbud A', nominal: 5.45, effective: 5.68, fee: 45, setup: 0 },
    { name: 'Eksempeltilbud B', nominal: 5.35, effective: 5.62, fee: 60, setup: 2500 },
    { name: 'Eksempeltilbud C', nominal: 5.55, effective: 5.73, fee: 0, setup: 0 }
  ];

  function annuity(balance, annualRate, months) {
    if (!balance || !months) return 0;
    const monthlyRate = annualRate / 100 / 12;
    if (!monthlyRate) return balance / months;
    return balance * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  }

  function rateForPayment(balance, months, payment) {
    if (!balance || !months || payment <= balance / months) return 0;
    let low = 0;
    let high = 30;
    for (let i = 0; i < 80; i += 1) {
      const mid = (low + high) / 2;
      if (annuity(balance, mid, months) > payment) high = mid;
      else low = mid;
    }
    return (low + high) / 2;
  }

  function addOffer(data = {}) {
    const node = template.content.firstElementChild.cloneNode(true);
    const values = { name: 'Nytt tilbud', nominal: 5.5, effective: 5.75, fee: 0, setup: 0, ...data };
    Object.entries(values).forEach(([key, value]) => {
      const input = node.querySelector(`[data-field="${key}"]`);
      if (input) input.value = value;
    });
    offerList.appendChild(node);
    renumberOffers();
  }

  function renumberOffers() {
    [...offerList.querySelectorAll('[data-offer]')].forEach((card, index) => {
      card.querySelector('.offer-number').textContent = `Tilbud ${index + 1}`;
      const name = card.querySelector('[data-field="name"]').value.trim();
      card.querySelector('[data-offer-title]').textContent = name || `Tilbud ${index + 1}`;
      const remove = card.querySelector('[data-remove-offer]');
      remove.hidden = offerList.children.length <= 1;
    });
  }

  function getOffers(balance, months) {
    return [...offerList.querySelectorAll('[data-offer]')].map((card, index) => {
      const get = key => card.querySelector(`[data-field="${key}"]`);
      const name = get('name').value.trim() || `Tilbud ${index + 1}`;
      const nominal = Math.max(0, Number(get('nominal').value) || 0);
      const effective = Math.max(0, Number(get('effective').value) || 0);
      const fee = Math.max(0, Number(get('fee').value) || 0);
      const setup = Math.max(0, Number(get('setup').value) || 0);
      const monthly = annuity(balance, nominal, months) + fee;
      const firstYear = monthly * Math.min(12, months) + setup;
      const total = monthly * months + setup;
      return { name, nominal, effective, fee, setup, monthly, firstYear, total };
    }).filter(offer => offer.nominal > 0 || offer.effective > 0);
  }

  function render() {
    const balance = number('loanBalance');
    const homeValue = number('homeValue');
    const years = Math.max(1, number('yearsLeft'));
    const months = Math.round(years * 12);
    const currentNominal = number('currentNominal');
    const currentEffective = number('currentEffective');
    const currentFee = number('currentFee');
    const currentBank = text('currentBank') || 'banken din';
    const currentMonthly = annuity(balance, currentNominal, months) + currentFee;
    const currentTotal = currentMonthly * months;
    const currentFirstYear = currentMonthly * Math.min(12, months);
    const ltv = homeValue > 0 ? balance / homeValue * 100 : 0;
    const offers = getOffers(balance, months).sort((a, b) => a.total - b.total);
    const best = offers[0];

    document.getElementById('currentMonthly').textContent = money.format(currentMonthly);
    document.getElementById('loanToValue').textContent = homeValue ? `${percent.format(ltv)} %` : 'Mangler boligverdi';

    const body = document.getElementById('rankingBody');
    if (!best || !balance) {
      document.getElementById('annualSaving').textContent = '–';
      document.getElementById('bestMonthly').textContent = '–';
      document.getElementById('monthlySaving').textContent = '–';
      document.getElementById('totalSaving').textContent = '–';
      document.getElementById('breakEven').textContent = '–';
      body.innerHTML = '<tr><td colspan="7" class="radar-empty">Legg inn lånet og minst ett tilbud for å se rangeringen.</td></tr>';
      return;
    }

    const monthlySaving = currentMonthly - best.monthly;
    const annualSaving = monthlySaving * 12;
    const totalSaving = currentTotal - best.total;
    const breakEvenMonths = monthlySaving > 0 ? Math.ceil(best.setup / monthlySaving) : Infinity;
    const profitable = totalSaving > 0;

    document.getElementById('bestMonthly').textContent = money.format(best.monthly);
    document.getElementById('monthlySaving').textContent = money.format(monthlySaving);
    document.getElementById('annualSaving').textContent = money.format(annualSaving);
    document.getElementById('totalSaving').textContent = money.format(totalSaving);
    document.getElementById('bestOfferLabel').textContent = `${best.name} mot ${currentBank}`;
    document.getElementById('breakEven').textContent = breakEvenMonths === Infinity ? 'Ikke tjent inn' : best.setup === 0 ? 'Med én gang' : `${breakEvenMonths} mnd`;
    document.getElementById('radarTitle').textContent = profitable ? `${best.name} ser billigst ut` : 'Dagens lån ser konkurransedyktig ut';
    document.getElementById('radarSummary').textContent = profitable
      ? `Med tallene dine er ${best.name} beregnet til ${money.format(Math.max(0, totalSaving))} lavere total kostnad over ${years} år.`
      : `Ingen av tilbudene du har lagt inn gir lavere beregnet totalkostnad enn dagens lån.`;

    const verdict = document.getElementById('radarVerdict');
    verdict.classList.toggle('is-positive', profitable);
    verdict.classList.toggle('is-negative', !profitable);
    verdict.innerHTML = profitable
      ? `<span class="radar-verdict-icon">↘</span><div><strong>Det kan lønne seg å forhandle</strong><p>${clean(best.name)} er omtrent ${money.format(Math.max(0, monthlySaving))} billigere per måned. Kontroller vilkårene før du bytter.</p></div>`
      : `<span class="radar-verdict-icon">✓</span><div><strong>Du har allerede et sterkt tilbud</strong><p>Be likevel banken bekrefte at renten din følger markedet og at det ikke finnes bedre vilkår for din belåningsgrad.</p></div>`;

    body.innerHTML = offers.map((offer, index) => {
      const difference = currentTotal - offer.total;
      const className = difference > 0 ? 'positive-value' : difference < 0 ? 'negative-value' : '';
      return `<tr${index === 0 ? ' class="best-row"' : ''}><td><strong>${clean(offer.name)}</strong>${index === 0 ? '<span class="best-chip">Best</span>' : ''}<small>${offer.setup ? `${money.format(offer.setup)} i oppstart` : 'Ingen oppstart lagt inn'}</small></td><td>${percent.format(offer.nominal)} %</td><td>${offer.effective ? `${percent.format(offer.effective)} %` : '–'}</td><td>${money.format(offer.monthly)}</td><td>${money.format(offer.firstYear)}</td><td>${money.format(offer.total)}</td><td class="${className}">${difference >= 0 ? '+' : '−'}${money.format(Math.abs(difference))}</td></tr>`;
    }).join('') + `<tr class="current-row"><td><strong>${clean(currentBank)}</strong><small>Dagens lån</small></td><td>${percent.format(currentNominal)} %</td><td>${currentEffective ? `${percent.format(currentEffective)} %` : '–'}</td><td>${money.format(currentMonthly)}</td><td>${money.format(currentFirstYear)}</td><td>${money.format(currentTotal)}</td><td>Referanse</td></tr>`;

    const targetPayment = Math.max(0, best.monthly + best.setup / months - currentFee);
    const matchRate = rateForPayment(balance, months, targetPayment);
    document.getElementById('matchRateCopy').textContent = profitable
      ? `${currentBank} bør omtrent tilby ${percent.format(matchRate)} % nominell rente eller lavere, gitt dagens termingebyr, for å matche ${best.name}.`
      : `${currentBank} er allerede minst like billig som tilbudene du har lagt inn.`;

    const rateGap = currentNominal - best.nominal;
    const message = profitable
      ? `Hei! Jeg har ${money.format(balance)} i boliglån hos ${currentBank}, med boligverdi på ca. ${money.format(homeValue)} og belåningsgrad på ${percent.format(ltv)} %. Jeg betaler i dag ${percent.format(currentNominal)} % nominell rente (${currentEffective ? `${percent.format(currentEffective)} % effektiv` : 'effektiv rente ikke oppgitt'}). Jeg har funnet tilbudet «${best.name}» med ${percent.format(best.nominal)} % nominell rente${best.effective ? ` og ${percent.format(best.effective)} % effektiv rente` : ''}. Med mine tall tilsvarer det omtrent ${money.format(Math.max(0, monthlySaving))} lavere kostnad per måned og ${money.format(Math.max(0, annualSaving))} per år. Kan dere matche eller slå dette tilbudet?`
      : `Hei! Jeg ønsker en ny vurdering av boliglånsrenten min. Jeg har ${money.format(balance)} i restgjeld, boligverdi på ca. ${money.format(homeValue)} og belåningsgrad på ${percent.format(ltv)} %. Dagens nominelle rente er ${percent.format(currentNominal)} %. Kan dere kontrollere at jeg har deres beste tilgjengelige betingelser for min belåningsgrad og kundesituasjon?`;
    document.getElementById('negotiationMessage').value = message;
  }

  offerList.addEventListener('input', event => {
    const card = event.target.closest('[data-offer]');
    if (card && event.target.matches('[data-field="name"]')) card.querySelector('[data-offer-title]').textContent = event.target.value.trim() || 'Banktilbud';
    render();
  });

  offerList.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-offer]');
    if (!remove) return;
    remove.closest('[data-offer]').remove();
    renumberOffers();
    render();
  });

  document.getElementById('addOffer').addEventListener('click', () => {
    if (offerList.children.length >= 8) return;
    addOffer({ name: `Nytt tilbud ${offerList.children.length + 1}` });
    render();
    offerList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  form.addEventListener('input', render);
  form.addEventListener('submit', event => { event.preventDefault(); render(); document.getElementById('radarResult').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  document.getElementById('resetRadar').addEventListener('click', () => {
    form.reset();
    offerList.innerHTML = '';
    defaults.forEach(addOffer);
    render();
  });

  document.getElementById('copyNegotiation').addEventListener('click', async () => {
    const field = document.getElementById('negotiationMessage');
    const feedback = document.getElementById('copyFeedback');
    try {
      await navigator.clipboard.writeText(field.value);
      feedback.textContent = 'Kopiert';
    } catch (error) {
      field.select();
      document.execCommand('copy');
      feedback.textContent = 'Kopiert';
    }
    window.setTimeout(() => { feedback.textContent = ''; }, 2200);
  });

  defaults.forEach(addOffer);
  render();

  window.RegningaRentesjekken = { annuity, rateForPayment };
})();