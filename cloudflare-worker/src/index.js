const SITE = [
  {slug:'pensjon',title:'Pensjon',description:'Folketrygd, AFP, tjenestepensjon, egen sparing og uttaksvalg.'},
  {slug:'jobb-mindre',title:'Jobbe mindre',description:'Redusert stilling, nettolønn, fritid og pensjonseffekt.'},
  {slug:'bolig',title:'Bolig',description:'Lån, renter, felleskostnader, vedlikehold og total bokostnad.'},
  {slug:'strom',title:'Strøm',description:'Spotpris, dusj, elbillading, hvitevarer og oppvarming.'},
  {slug:'bil',title:'Bil',description:'Finansiering, verditap, drivstoff, forsikring og pris per kilometer.'},
  {slug:'pendling',title:'Pendling',description:'Bil, kollektiv, bom, parkering og tidsbruk.'},
  {slug:'samboer',title:'Samboer',description:'Fordeling av fellesutgifter etter 50/50, inntekt eller likt igjen.'},
  {slug:'barn',title:'Barn',description:'Engangskjøp og løpende kostnader.'},
  {slug:'hund',title:'Hund',description:'Første år og vanlige årlige kostnader.'}
];
function cors(origin, allowed){return {'access-control-allow-origin':allowed.includes(origin)?origin:allowed[0],'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type','vary':'Origin','content-type':'application/json; charset=utf-8'}}
export default {async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=(env.ALLOWED_ORIGINS||'https://regninga.no,https://www.regninga.no').split(',').map(x=>x.trim());
  const headers=cors(origin,allowed);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(request.method!=='POST') return new Response(JSON.stringify({error:'Kun POST er tillatt.'}),{status:405,headers});
  if(!allowed.includes(origin)) return new Response(JSON.stringify({error:'Ugyldig opprinnelse.'}),{status:403,headers});
  let body; try{body=await request.json()}catch{return new Response(JSON.stringify({error:'Ugyldig forespørsel.'}),{status:400,headers})}
  const question=String(body.question||'').trim();
  if(question.length<2||question.length>500) return new Response(JSON.stringify({error:'Spørsmålet må være mellom 2 og 500 tegn.'}),{status:400,headers});
  const developer=`Du er Banken, KI-søkemotoren på den norske nettsiden Regninga.no. Du svarer KUN på spørsmål om privatøkonomi, hverdagsøkonomi, arbeid, lønn, skatt, pensjon, sparing, gjeld, bolig, strøm, bil, pendling, familieøkonomi, forsikring og økonomiske valg. Hvis spørsmålet ikke er økonomirelatert, svar nøyaktig: "Det ekke mitt bord, ass. Spør meg om økonomi i stedet." Ikke svar på andre temaer. Svar på norsk, kort og forståelig, vanligvis 2–5 setninger. Ikke lat som du kjenner brukerens personlige tall. Ikke gi garantier, og si tydelig når noe er et anslag. Ved skatt, pensjon, investering eller andre regler som kan endres, anbefal kontroll hos relevant offentlig eller autorisert kilde. Bruk kalkulatorlisten til å anbefale relevante sider. Returner KUN gyldig JSON i formatet {"in_scope":true|false,"answer":"tekst","calculators":["slug"]}. Maks tre slugs. Tilgjengelige kalkulatorer: ${JSON.stringify(SITE)}.`;
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'authorization':`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5-mini',input:[{role:'developer',content:[{type:'input_text',text:developer}]},{role:'user',content:[{type:'input_text',text:question}]}],max_output_tokens:500})});
  const data=await r.json();
  if(!r.ok) return new Response(JSON.stringify({error:'KI-tjenesten svarte ikke som forventet.'}),{status:502,headers});
  const text=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text||'';
  try{return new Response(JSON.stringify(JSON.parse(text)),{status:200,headers})}catch{return new Response(JSON.stringify({in_scope:true,answer:text||'Jeg klarte ikke å formulere et svar akkurat nå.',calculators:[]}),{status:200,headers})}
}};
