(() => {
  'use strict';

  const form = document.getElementById('bankForm');
  const input = document.getElementById('bankQuery');
  const messages = document.getElementById('bankMessages');
  const results = document.getElementById('bankResults');

  const pages = [
    {title:"Rentesjekken",url:"../rentesjekken/",keys:["rentesjekken", "rentesammenligning", "sammenligne renter", "bankrente", "boliglånsrente", "bytte bank", "prute rente", "finansportalen"],desc:"Sammenlign dagens boliglån med konkrete banktilbud."},
    {title:"Ekstra nedbetaling eller sparing?",url:"../ekstra-nedbetaling-eller-sparing/",keys:["ekstra nedbetaling", "betale ned lån", "sparing", "fond", "høyrentekonto", "avdrag"],desc:"Sammenlign ekstra avdrag med langsiktig sparing."},
    {title:"Fastrente eller flytende rente?",url:"../fastrente-eller-flytende/",keys:["fastrente", "flytende rente", "rentevalg", "bindingstid", "boliglån"],desc:"Sammenlign fastrente med forventet flytende rente."},
    {title:"Refinansieringskalkulator",url:"../refinansiering/",keys:["refinansiering", "refinansiere", "bytte bank", "lavere rente", "samle lån"],desc:"Se besparelse og når byttekostnaden er tjent inn."},
    {title:"Utleie av rom",url:"../utleie-av-rom/",keys:["utleie", "leie ut rom", "hybel", "husleieinntekt", "romutleie"],desc:"Se nettoinntekt fra å leie ut et rom."},
    {title:"Studentbudsjett",url:"../studentbudsjett/",keys:["studentbudsjett", "student", "studielån", "stipend", "lån og stipend", "studentøkonomi"],desc:"Se dagsbudsjett, underskudd og nødvendig jobbinntekt."},
    {title:"Frilans-timepris",url:"../frilans-timepris/",keys:["frilans", "timepris", "fakturere", "selvstendig", "konsulent", "freelance"],desc:"Finn en bærekraftig timepris som frilanser."},
    {title:"Elbillading hjemme eller offentlig?",url:"../elbillading/",keys:["elbillading", "lade elbil", "hjemmelading", "hurtiglading", "ladeboks", "strøm bil"],desc:"Sammenlign hjemmelading, hurtiglading og ladeboks."},
    {title:"Hyttekalkulator",url:"../hyttekalkulator/",keys:["hytte", "fritidsbolig", "hyttekostnad", "pris per natt", "hyttelån"],desc:"Se årskostnad, månedspris og pris per natt."},
    {title:"Førerkortkalkulator",url:"../forerkort/",keys:["førerkort", "kjøretimer", "oppkjøring", "trafikkskole", "lappen"],desc:"Lag totalbudsjett og spareplan for førerkort."},
    {title:"Alene etter samlivsbrudd",url:"../alene-etter-samlivsbrudd/",keys:["samlivsbrudd", "skilsmisse", "alene økonomi", "flytte fra partner", "ny husholdning"],desc:"Se månedsbudsjett og oppstartskostnader alene."},
    {title:"Overtid eller fritid?",url:"../overtid-eller-fritid/",keys:["overtid", "fritid", "overtidsbetaling", "ekstra arbeid", "timeverdi"],desc:"Sammenlign netto overtidsbetaling med fritid."},
    {title:"Ulønnet permisjon",url:"../ulonnet-permisjon/",keys:["ulønnet permisjon", "permisjon uten lønn", "fri fra jobb", "buffer permisjon"],desc:"Se nødvendig buffer og hvor lenge pengene varer."},
    {title:"Rentestress",url:"../rentestress/",keys:["rentestress", "renteøkning", "boliglån rente", "høyere rente", "tåle rente"],desc:"Stresstest boliglånet med høyere rente."},
    {title:"Kausjonist og medlåntaker",url:"../kausjonist-medlantaker/",keys:["kausjonist", "medlåntaker", "garanti", "ansvar lån", "hjelpe boligkjøp"],desc:"Synliggjør ansvar og mulig belastning ved kausjon."},
    {title:"Solceller – nedbetalingstid",url:"../solceller/",keys:["solceller", "solcelleanlegg", "nedbetalingstid", "egen strøm", "solenergi"],desc:"Se nedbetalingstid og nettoverdi for solceller."},
    {title:"Varmepumpe – lønner det seg?",url:"../varmepumpe/",keys:["varmepumpe", "oppvarming", "spare strøm", "nedbetalingstid varmepumpe"],desc:"Se årlig besparelse og nedbetalingstid."},
    {title:"Flytting til en ny by",url:"../flytting-ny-by/",keys:["flytte ny by", "flytting", "levekostnader", "bytte by", "ny jobb by"],desc:"Sammenlign økonomien før og etter flytting."},
    {title:"Babypakke – nytt eller brukt?",url:"../babypakke-nytt-eller-brukt/",keys:["babypakke", "babyutstyr", "brukt baby", "nytt eller brukt baby", "barnevogn"],desc:"Sammenlign ny og brukt babypakke etter videresalg."},
    {title:"Dyr nummer to",url:"../dyr-nummer-to/",keys:["dyr nummer to", "hund nummer to", "katt nummer to", "ekstra kjæledyr", "to hunder"],desc:"Beregn merkostnaden ved et ekstra kjæledyr."},
    {title:"Konfirmasjonsbudsjett",url:"../konfirmasjon/",keys:["konfirmasjon", "konfirmasjonsbudsjett", "fest", "konfirmant", "gjester"],desc:"Lag budsjett og spareplan for konfirmasjon."},
    {title:"Julebudsjett",url:"../julebudsjett/",keys:["julebudsjett", "jul", "julegaver", "desember", "spare til jul"],desc:"Se total julekostnad og månedlig sparebehov."},
    {title:"Kontantkjøp eller finansiering?",url:"../kontant-eller-finansiering/",keys:["kontantkjøp", "finansiering", "betale kontant", "billån", "delbetaling"],desc:"Sammenlign finansieringskostnad med mulig avkastning."},
    {title:"Kredittkortets egentlige pris",url:"../kredittkort-pris/",keys:["kredittkort", "kredittkortgjeld", "minstebeløp", "kredittkortrente", "dyr gjeld"],desc:"Se tid, renter og effekten av høyere betaling."},
    {title:"Lønnsøkningens verdi",url:"../lonnsokningens-verdi/",keys:["lønnsøkning", "høyere lønn", "lønnstilbud", "netto lønn", "lønn etter skatt"],desc:"Se netto verdi per måned, år og arbeidstime."},
    {title:"Hjemmekontor eller kontor?",url:"../hjemmekontor-eller-kontor/",keys:["hjemmekontor", "kontor", "pendling hjemmekontor", "jobbe hjemme", "kontordag"],desc:"Sammenlign kostnad og tid hjemme mot kontoret."},
    {title:'Bufferkalkulator',url:'../buffer/',keys:['buffer','bufferkonto','nødsparing','økonomisk trygghet','uforutsette utgifter'],desc:'Finn et personlig mål for økonomisk buffer.'},
    {title:'Abonnementssjekken',url:'../abonnementssjekken/',keys:['abonnement','streaming','mobil','trening','apper','faste trekk'],desc:'Se månedspris, årspris og mulig besparelse.'},
    {title:'Matbudsjett',url:'../matbudsjett/',keys:['matbudsjett','mat','dagligvarer','takeaway','matsvinn','husholdning'],desc:'Samle dagligvarer og mat ute i ett budsjett.'},
    {title:'Ny jobb – lønner det seg?',url:'../ny-jobb/',keys:['ny jobb','bytte jobb','lønn','pendling','fritid','jobbgoder'],desc:'Sammenlign to jobber i kroner og tid.'},
    {title:'Oppussingskalkulator',url:'../oppussing/',keys:['oppussing','renovere','materialer','håndverker','prosjektbudsjett'],desc:'Beregn prosjektpris, buffer og finansiering.'},
    {title:'Hvor mye bolig har du råd til?',url:'../hvor-mye-bolig/',keys:['hvor mye bolig','råd til bolig','boligpris','låneramme','egenkapital','rentestress'],desc:'Finn et komfortabelt prisnivå med rentestress.'},
    {title:'Bryllupskalkulator',url:'../bryllup/',keys:['bryllup','gifte seg','gjester','bryllupsbudsjett','fest'],desc:'Lag totalbudsjett og spareplan for bryllup.'},
    {title:'Feriebudsjett',url:'../feriebudsjett/',keys:['ferie','reise','feriebudsjett','hotell','fly','spare til ferie'],desc:'Planlegg totalpris og sparing til ferien.'},
    {title:'Kjøpe nytt eller brukt?',url:'../nytt-eller-brukt/',keys:['nytt eller brukt','brukt','nytt','verditap','eierkostnad','kjøpe brukt'],desc:'Sammenlign total eierkostnad for nytt og brukt.'},
    {title:'Forsikringssjekken',url:'../forsikringssjekken/',keys:['forsikring','forsikringer','egenandel','overlapp','innbo','reise'],desc:'Samle premier, egenandeler og mulig overlapp.'},
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
      : `Jeg fant ingen tydelig kalkulator for «${escapeHtml(query)}». Prøv et enklere søkeord, som bolig, refinansiering, student, hytte, strøm eller jobb.`;
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
