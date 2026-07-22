(() => {
'use strict';
const form=document.getElementById('bankForm'), input=document.getElementById('bankQuery'), messages=document.getElementById('bankMessages'), results=document.getElementById('bankResults');
const pages=[
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
const economyWords=['kr','kroner','pris','koster','kostnad','råd','økonomi','penger','lønn','skatt','gjeld','lån','sparing','budsjett','utgift','inntekt','forsikring','pensjon','bolig','bil','strøm','barn','hund','samboer','pendling','jobb'];
const escape=s=>s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function rank(q){const s=q.toLowerCase();return pages.map(p=>({...p,score:p.keys.reduce((n,k)=>n+(s.includes(k)?(k.includes(' ')?4:2):0),0)})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score)}
function add(text,type='bot',links=[]){const el=document.createElement('div');el.className='bank-message bank-message-'+type;el.innerHTML=type==='bot'?`<div class="bank-avatar">B</div><div><strong>Banken</strong><p>${text}</p>${links.length?'<div class="bank-answer-links">'+links.map(x=>`<a href="${x.url}">${x.title} <span>→</span></a>`).join('')+'</div>':''}</div>`:`<div><strong>Du</strong><p>${escape(text)}</p></div>`;messages.appendChild(el);messages.scrollTop=messages.scrollHeight}
function answer(q){const low=q.toLowerCase(), found=rank(q), isEconomy=economyWords.some(w=>low.includes(w))||found.length;
 if(!isEconomy){add('Sorry kompis! Jeg skjønner ikke bæret. Spør meg heller om penger, pensjon, bolig, bil eller andre økonomiske valg.');return}
 if(found.length){const top=found.slice(0,3);let text=`Det høres ut som du bør starte med <strong>${top[0].title}</strong>. ${top[0].desc}`;if(low.includes('råd')||low.includes('budsjett')) text+=' Legg inn dine egne tall for et mer nyttig estimat.';add(text,'bot',top);showResults(top);return}
 add('Det er absolutt mitt bord. Jeg fant ingen helt presis kalkulator ennå, men prøv å skrive spørsmålet med ord som bolig, bil, strøm, pensjon, samboer eller jobb mindre.');
}
function showResults(items){results.innerHTML=items.map(x=>`<a href="${x.url}"><strong>${x.title}</strong><span>${x.desc}</span></a>`).join('')}
form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q)return;add(q,'user');input.value='';setTimeout(()=>answer(q),260)});
document.querySelectorAll('.bank-suggestions button').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;form.requestSubmit()}));
document.getElementById('bankClear').addEventListener('click',()=>{messages.innerHTML='<div class="bank-message bank-message-bot"><div class="bank-avatar">B</div><div><strong>Banken</strong><p>Still et spørsmål, så finner jeg den mest relevante kalkulatoren.</p></div></div>';results.innerHTML='';input.focus()});
})();