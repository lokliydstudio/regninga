(() => {
  'use strict';

  const form = document.getElementById('bankForm');
  const input = document.getElementById('bankQuery');
  const messages = document.getElementById('bankMessages');
  const results = document.getElementById('bankResults');

  const pages = [
    {title:'Pensjon',url:'../pensjon/',keys:['pensjon','afp','folketrygd','nav','tjenestepensjon','pensjonere','pensjonsalder','gå av'],desc:'Beregn folketrygd, AFP, egen pensjon og ulike uttaksvalg.'},
    {title:'Jobbe mindre',url:'../jobb-mindre/',keys:['jobbe mindre','80 prosent','80 %','redusert stilling','fritid','deltid','stillingsprosent','kortere uke'],desc:'Se hva redusert stilling koster og hvor mye fritid du får.'},
    {title:'Bolig',url:'../bolig/',keys:['bolig','boliglån','rente','hus','leilighet','felleskostnad','egenkapital','bokostnad','lån'],desc:'Finn den reelle månedskostnaden for boligen.'},
    {title:'Strøm',url:'../strom/',keys:['strøm','strom','spotpris','dusj','elbil','lade','oppvarming','kwh','hvitevarer'],desc:'Regn på strøm, lading, dusj og oppvarming.'},
    {title:'Bil',url:'../bil/',keys:['bil','bensin','diesel','elbil','bilforsikring','verditap','kilometer','billån'],desc:'Se kostnaden per måned og kilometer.'},
    {title:'Pendling',url:'../pendling/',keys:['pendling','pendle','jobbvei','kollektiv','buss','tog','bom','parkering','reise til jobb'],desc:'Sammenlign bil og kollektivtransport.'},
    {title:'Samboer',url:'../samboer/',keys:['samboer','dele utgifter','50/50','fellesutgifter','partner','fordele utgifter'],desc:'Fordel fellesutgiftene på en rettferdig måte.'},
    {title:'Barn',url:'../barn/',keys:['barn','baby','barnehage','sfo','bleier','familie'],desc:'Se engangskjøp og løpende kostnader.'},
    {title:'Hund',url:'../hund/',keys:['hund','valp','veterinær','hundefôr','hundemat'],desc:'Beregn første år og et vanlig hundeår.'}
  ];

  const escapeHtml = value => value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function findMatches(query) {
    const q = normalize(query.trim());
    if (!q) return [];
    const words = q.split(/\s+/).filter(word => word.length > 1);

    return pages.map(page => {
      const haystack = normalize([page.title, page.desc, ...page.keys].join(' '));
      let score = 0;
      page.keys.forEach(key => {
        const normalizedKey = normalize(key);
        if (q.includes(normalizedKey)) score += normalizedKey.includes(' ') ? 8 : 5;
        if (normalizedKey.includes(q)) score += 4;
      });
      words.forEach(word => {
        if (haystack.includes(word)) score += word.length >= 5 ? 2 : 1;
      });
      return {...page, score};
    }).filter(page => page.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
  }

  function showMessage(query, matches) {
    const text = matches.length
      ? `Her er ${matches.length === 1 ? 'kalkulatoren' : 'kalkulatorene'} som passer best til «${escapeHtml(query)}».`
      : `Jeg fant ingen tydelig kalkulator for «${escapeHtml(query)}». Prøv et enklere søkeord, som bolig, bil, strøm, pensjon eller barn.`;
    messages.innerHTML = `<div class="bank-message bank-message-bot"><div class="bank-avatar">B</div><div><strong>Banken</strong><p>${text}</p></div></div>`;
  }

  function showResults(matches) {
    results.innerHTML = matches.map(item => `<a href="${item.url}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.desc)} →</span></a>`).join('');
  }

  function search(query) {
    const matches = findMatches(query);
    showMessage(query, matches);
    showResults(matches);
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (query) search(query);
  });

  document.querySelectorAll('.bank-suggestions button').forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.textContent.trim();
      search(input.value);
    });
  });

  document.getElementById('bankClear')?.addEventListener('click', () => {
    input.value = '';
    results.innerHTML = '';
    messages.innerHTML = '<div class="bank-message bank-message-bot"><div class="bank-avatar">B</div><div><strong>Banken</strong><p>Skriv hva du leter etter, så finner Banken den mest relevante kalkulatoren.</p></div></div>';
    input.focus();
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    search(initialQuery);
  }
})();
