(() => {
  'use strict';
  const form = document.getElementById('homeSearchForm');
  const input = document.getElementById('homeSearchInput');
  const results = document.getElementById('homeSearchResults');
  if (!form || !input || !results) return;

  const pages = [
    {title:'Rentesjekken',url:'rentesjekken/',keys:['rentesjekken','rentesammenligning','sammenligne renter','bankrente','boliglånsrente','bytte bank','prute rente','finansportalen']},
    {title:"Ekstra nedbetaling eller sparing?",url:"ekstra-nedbetaling-eller-sparing/",keys:["ekstra nedbetaling", "betale ned lån", "sparing", "fond", "høyrentekonto", "avdrag"]},
    {title:"Fastrente eller flytende rente?",url:"fastrente-eller-flytende/",keys:["fastrente", "flytende rente", "rentevalg", "bindingstid", "boliglån"]},
    {title:"Refinansieringskalkulator",url:"refinansiering/",keys:["refinansiering", "refinansiere", "bytte bank", "lavere rente", "samle lån"]},
    {title:"Utleie av rom",url:"utleie-av-rom/",keys:["utleie", "leie ut rom", "hybel", "husleieinntekt", "romutleie"]},
    {title:"Studentbudsjett",url:"studentbudsjett/",keys:["studentbudsjett", "student", "studielån", "stipend", "lån og stipend", "studentøkonomi"]},
    {title:"Frilans-timepris",url:"frilans-timepris/",keys:["frilans", "timepris", "fakturere", "selvstendig", "konsulent", "freelance"]},
    {title:"Elbillading hjemme eller offentlig?",url:"elbillading/",keys:["elbillading", "lade elbil", "hjemmelading", "hurtiglading", "ladeboks", "strøm bil"]},
    {title:"Hyttekalkulator",url:"hyttekalkulator/",keys:["hytte", "fritidsbolig", "hyttekostnad", "pris per natt", "hyttelån"]},
    {title:"Førerkortkalkulator",url:"forerkort/",keys:["førerkort", "kjøretimer", "oppkjøring", "trafikkskole", "lappen"]},
    {title:"Alene etter samlivsbrudd",url:"alene-etter-samlivsbrudd/",keys:["samlivsbrudd", "skilsmisse", "alene økonomi", "flytte fra partner", "ny husholdning"]},
    {title:"Overtid eller fritid?",url:"overtid-eller-fritid/",keys:["overtid", "fritid", "overtidsbetaling", "ekstra arbeid", "timeverdi"]},
    {title:"Ulønnet permisjon",url:"ulonnet-permisjon/",keys:["ulønnet permisjon", "permisjon uten lønn", "fri fra jobb", "buffer permisjon"]},
    {title:"Rentestress",url:"rentestress/",keys:["rentestress", "renteøkning", "boliglån rente", "høyere rente", "tåle rente"]},
    {title:"Kausjonist og medlåntaker",url:"kausjonist-medlantaker/",keys:["kausjonist", "medlåntaker", "garanti", "ansvar lån", "hjelpe boligkjøp"]},
    {title:"Solceller – nedbetalingstid",url:"solceller/",keys:["solceller", "solcelleanlegg", "nedbetalingstid", "egen strøm", "solenergi"]},
    {title:"Varmepumpe – lønner det seg?",url:"varmepumpe/",keys:["varmepumpe", "oppvarming", "spare strøm", "nedbetalingstid varmepumpe"]},
    {title:"Flytting til en ny by",url:"flytting-ny-by/",keys:["flytte ny by", "flytting", "levekostnader", "bytte by", "ny jobb by"]},
    {title:"Babypakke – nytt eller brukt?",url:"babypakke-nytt-eller-brukt/",keys:["babypakke", "babyutstyr", "brukt baby", "nytt eller brukt baby", "barnevogn"]},
    {title:"Dyr nummer to",url:"dyr-nummer-to/",keys:["dyr nummer to", "hund nummer to", "katt nummer to", "ekstra kjæledyr", "to hunder"]},
    {title:"Konfirmasjonsbudsjett",url:"konfirmasjon/",keys:["konfirmasjon", "konfirmasjonsbudsjett", "fest", "konfirmant", "gjester"]},
    {title:"Julebudsjett",url:"julebudsjett/",keys:["julebudsjett", "jul", "julegaver", "desember", "spare til jul"]},
    {title:"Kontantkjøp eller finansiering?",url:"kontant-eller-finansiering/",keys:["kontantkjøp", "finansiering", "betale kontant", "billån", "delbetaling"]},
    {title:"Kredittkortets egentlige pris",url:"kredittkort-pris/",keys:["kredittkort", "kredittkortgjeld", "minstebeløp", "kredittkortrente", "dyr gjeld"]},
    {title:"Lønnsøkningens verdi",url:"lonnsokningens-verdi/",keys:["lønnsøkning", "høyere lønn", "lønnstilbud", "netto lønn", "lønn etter skatt"]},
    {title:"Hjemmekontor eller kontor?",url:"hjemmekontor-eller-kontor/",keys:["hjemmekontor", "kontor", "pendling hjemmekontor", "jobbe hjemme", "kontordag"]},
    {title:'Bufferkalkulator',url:'buffer/',keys:['buffer','bufferkonto','nødsparing','økonomisk trygghet','uforutsette utgifter']},
    {title:'Abonnementssjekken',url:'abonnementssjekken/',keys:['abonnement','streaming','mobil','trening','apper','faste trekk']},
    {title:'Matbudsjett',url:'matbudsjett/',keys:['matbudsjett','mat','dagligvarer','takeaway','matsvinn','husholdning']},
    {title:'Ny jobb – lønner det seg?',url:'ny-jobb/',keys:['ny jobb','bytte jobb','lønn','pendling','fritid','jobbgoder']},
    {title:'Oppussingskalkulator',url:'oppussing/',keys:['oppussing','renovere','materialer','håndverker','prosjektbudsjett']},
    {title:'Hvor mye bolig har du råd til?',url:'hvor-mye-bolig/',keys:['hvor mye bolig','råd til bolig','boligpris','låneramme','egenkapital','rentestress']},
    {title:'Bryllupskalkulator',url:'bryllup/',keys:['bryllup','gifte seg','gjester','bryllupsbudsjett','fest']},
    {title:'Feriebudsjett',url:'feriebudsjett/',keys:['ferie','reise','feriebudsjett','hotell','fly','spare til ferie']},
    {title:'Kjøpe nytt eller brukt?',url:'nytt-eller-brukt/',keys:['nytt eller brukt','brukt','nytt','verditap','eierkostnad','kjøpe brukt']},
    {title:'Forsikringssjekken',url:'forsikringssjekken/',keys:['forsikring','forsikringer','egenandel','overlapp','innbo','reise']},
    {title:'Leie eller kjøpe',url:'leie-eller-kjope/',keys:['leie eller kjøpe','leie','kjøpe bolig','eie bolig','husleie','boligkjøp']},
    {title:'Flytte hjemmefra',url:'flytte-hjemmefra/',keys:['flytte hjemmefra','flytte ut','depositum','månedsbudsjett','studentbudsjett','første bolig']},
    {title:'Gjeldsfri',url:'gjeldsfri/',keys:['gjeldsfri','gjeld','kredittkort','forbrukslån','nedbetaling','renter','sluttdato']},
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
  const escapeHtml = value => value.replace(/[&<>"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', 'homeSearchResults');
  input.setAttribute('aria-expanded', 'false');

  function matches(query) {
    const q = normalize(query.trim());
    const words = q.split(/\s+/).filter(word => word.length > 1);
    return pages.map(page => {
      const text = normalize([page.title, ...page.keys].join(' '));
      let score = 0;
      page.keys.forEach(key => {
        const k = normalize(key);
        if (q === k) score += 12;
        else if (q.includes(k)) score += k.includes(' ') ? 8 : 5;
        if (k.startsWith(q)) score += 5;
        else if (k.includes(q)) score += 3;
      });
      words.forEach(word => { if (text.includes(word)) score += word.length >= 5 ? 2 : 1; });
      return {...page, score};
    }).filter(page => page.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'nb'));
  }

  function renderSuggestions(query) {
    if (query.trim().length < 2) {
      results.innerHTML = '';
      input.setAttribute('aria-expanded', 'false');
      return [];
    }
    const found = matches(query).slice(0, 5);
    if (!found.length) {
      results.innerHTML = '<p class="search-no-result">Ingen direkte treff. Trykk «Finn kalkulator» for å få hjelp.</p>';
      input.setAttribute('aria-expanded', 'true');
      return [];
    }
    results.innerHTML = `<div class="search-suggestion-list" role="listbox">${found.map(page => `
      <a class="search-suggestion" role="option" href="${page.url}">
        <span>${escapeHtml(page.title)}</span><small>Start kalkulator <span aria-hidden="true">→</span></small>
      </a>`).join('')}</div>`;
    input.setAttribute('aria-expanded', 'true');
    return found;
  }

  input.addEventListener('input', () => renderSuggestions(input.value));
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      results.innerHTML = '';
      input.setAttribute('aria-expanded', 'false');
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }
    const found = matches(query);
    if (found.length) {
      window.location.href = found[0].url;
      return;
    }
    window.location.href = `banken/?q=${encodeURIComponent(query)}`;
  });
})();
