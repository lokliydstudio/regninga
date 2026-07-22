(() => {
  'use strict';
  const form = document.getElementById('bankForm');
  const input = document.getElementById('bankQuery');
  const messages = document.getElementById('bankMessages');
  const results = document.getElementById('bankResults');
  const submit = form?.querySelector('button[type="submit"]');
  const endpoint = window.REGNINGA_BANKEN?.apiEndpoint || '';
  const pages = [
    {title:'Pensjon',url:'../pensjon/',keys:['pensjon','afp','folketrygd','nav','tjenestepensjon','pensjonere','pensjonsalder'],desc:'Beregn folketrygd, AFP, egen pensjon og ulike uttaksvalg.'},
    {title:'Jobbe mindre',url:'../jobb-mindre/',keys:['jobbe mindre','80 prosent','redusert stilling','fritid','deltid','stillingsprosent'],desc:'Se hva redusert stilling koster og hvor mye fritid du får.'},
    {title:'Bolig',url:'../bolig/',keys:['bolig','boliglån','rente','hus','leilighet','felleskostnad','egenkapital'],desc:'Finn den reelle månedskostnaden for boligen.'},
    {title:'Strøm',url:'../strom/',keys:['strøm','spotpris','dusj','elbil','lade','oppvarming','kwh','hvitevarer'],desc:'Regn på strøm, lading, dusj og oppvarming.'},
    {title:'Bil',url:'../bil/',keys:['bil','bensin','diesel','elbil','forsikring','verditap','kilometer'],desc:'Se kostnaden per måned og kilometer.'},
    {title:'Pendling',url:'../pendling/',keys:['pendling','jobbvei','kollektiv','buss','tog','bom','parkering'],desc:'Sammenlign bil og kollektivtransport.'},
    {title:'Samboer',url:'../samboer/',keys:['samboer','dele utgifter','50/50','fellesutgifter','partner'],desc:'Fordel fellesutgiftene på en rettferdig måte.'},
    {title:'Barn',url:'../barn/',keys:['barn','baby','barnehage','sfo','bleier'],desc:'Se engangskjøp og løpende kostnader.'},
    {title:'Hund',url:'../hund/',keys:['hund','valp','veterinær','hundefôr'],desc:'Beregn første år og et vanlig hundeår.'}
  ];
  const escape = s => s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function localMatches(q){const s=q.toLowerCase();return pages.map(p=>({...p,score:p.keys.reduce((n,k)=>n+(s.includes(k)?(k.includes(' ')?4:2):0),0)})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,3)}
  function add(text,type='bot',links=[]){const el=document.createElement('div');el.className='bank-message bank-message-'+type;el.innerHTML=type==='bot'?`<div class="bank-avatar">B</div><div><strong>Banken</strong><p>${text}</p>${links.length?'<div class="bank-answer-links">'+links.map(x=>`<a href="${x.url}">${escape(x.title)} <span>→</span></a>`).join('')+'</div>':''}</div>`:`<div><strong>Du</strong><p>${escape(text)}</p></div>`;messages.appendChild(el);messages.scrollTop=messages.scrollHeight}
  function showResults(items){results.innerHTML=items.map(x=>`<a href="${x.url}"><strong>${escape(x.title)}</strong><span>${escape(x.desc)} →</span></a>`).join('')}
  async function askAI(question){
    if(!endpoint || endpoint.includes('DIN-WORKER')) throw new Error('Banken er ikke koblet til KI-endepunktet ennå.');
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'Banken fikk ikke kontakt med KI-tjenesten.');
    return data;
  }
  async function handle(question){
    const local=localMatches(question);
    if(local.length) showResults(local);
    submit.disabled=true; submit.textContent='Banken tenker …';
    try{
      const data=await askAI(question);
      if(data.in_scope===false){add(escape(data.answer||'Det ekke mitt bord, ass. Spør meg om økonomi i stedet.'));return;}
      const links=(Array.isArray(data.calculators)?data.calculators:[]).map(slug=>pages.find(p=>p.url.includes(`../${slug}/`))).filter(Boolean).slice(0,3);
      add(escape(data.answer||'Jeg fant ikke et godt svar akkurat nå.'),'bot',links.length?links:local);
      if(links.length) showResults(links);
    }catch(err){
      const fallback=local.length?`Jeg fant en relevant kalkulator mens KI-tjenesten er utilgjengelig: <strong>${escape(local[0].title)}</strong>.`:'Banken er midlertidig utilgjengelig. Prøv igjen om litt.';
      add(fallback,'bot',local);
    }finally{submit.disabled=false;submit.textContent='Spør Banken →';}
  }
  form?.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q)return;add(q,'user');input.value='';handle(q)});
  document.querySelectorAll('.bank-suggestions button').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;form.requestSubmit()}));
  document.getElementById('bankClear')?.addEventListener('click',()=>{messages.innerHTML='<div class="bank-message bank-message-bot"><div class="bank-avatar">B</div><div><strong>Banken</strong><p>Ny runde. Hva vil du vite om økonomi?</p></div></div>';results.innerHTML='';input.focus()});
})();
