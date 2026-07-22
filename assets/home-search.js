(() => {
  'use strict';

  const form = document.getElementById('homeSearchForm');
  const input = document.getElementById('homeSearchInput');
  const results = document.getElementById('homeSearchResults');
  if (!form || !input || !results) return;

  const pages = [
    {title:'Pensjon',url:'pensjon/',keys:['pensjon','afp','folketrygd','nav','tjenestepensjon','pensjonere','pensjonsalder','gå av']},
    {title:'Jobbe mindre',url:'jobb-mindre/',keys:['jobbe mindre','80 prosent','80 %','redusert stilling','fritid','deltid','stillingsprosent','kortere uke']},
    {title:'Bolig',url:'bolig/',keys:['bolig','boliglån','rente','hus','leilighet','felleskostnad','egenkapital','bokostnad','lån']},
    {title:'Strøm',url:'strom/',keys:['strøm','strom','spotpris','dusj','elbil','lade','oppvarming','kwh','hvitevarer']},
    {title:'Bil',url:'bil/',keys:['bil','bensin','diesel','elbil','bilforsikring','verditap','kilometer','billån']},
    {title:'Pendling',url:'pendling/',keys:['pendling','pendle','jobbvei','kollektiv','buss','tog','bom','parkering','reise til jobb']},
    {title:'Samboer',url:'samboer/',keys:['samboer','dele utgifter','50/50','fellesutgifter','partner','fordele utgifter']},
    {title:'Barn',url:'barn/',keys:['barn','baby','barnehage','sfo','bleier','familie']},
    {title:'Hund',url:'hund/',keys:['hund','valp','veterinær','hundefôr','hundemat']}
  ];

  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function matches(query) {
    const q = normalize(query.trim());
    const words = q.split(/\s+/).filter(word => word.length > 1);
    return pages.map(page => {
      const text = normalize([page.title, ...page.keys].join(' '));
      let score = 0;
      page.keys.forEach(key => {
        const k = normalize(key);
        if (q.includes(k)) score += k.includes(' ') ? 8 : 5;
        if (k.includes(q)) score += 4;
      });
      words.forEach(word => { if (text.includes(word)) score += word.length >= 5 ? 2 : 1; });
      return {...page, score};
    }).filter(page => page.score > 0).sort((a, b) => b.score - a.score);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    const found = matches(query);
    if (found.length === 1 || (found[0] && found[0].score >= 5 && (!found[1] || found[0].score >= found[1].score + 3))) {
      window.location.href = found[0].url;
      return;
    }
    window.location.href = `banken/?q=${encodeURIComponent(query)}`;
  });
})();
