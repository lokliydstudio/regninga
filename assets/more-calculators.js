(() => {
  'use strict';
  const type = document.body.dataset.moreCalculator;
  const form = document.querySelector('[data-more-calculator-form]');
  if (!type || !form) return;

  const money = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 });
  const el = id => document.getElementById(id);
  const raw = id => Number(el(id)?.value) || 0;
  const value = id => Math.max(0, raw(id));
  const kr = n => `${money.format(Math.round(n))} kr`;
  const set = (id, text) => { if (el(id)) el(id).textContent = text; };
  const warning = text => { const target = el('warning'); if (!target) return; target.style.display = text ? 'block' : 'none'; target.textContent = text || ''; };
  const duration = months => { const safe = Math.max(0, Math.round(months)); const years = Math.floor(safe / 12); const rest = safe % 12; return [years ? `${years} år` : '', rest ? `${rest} mnd` : ''].filter(Boolean).join(' ') || '0 mnd'; };
  const annuity = (principal, annualRate, years) => { if (principal <= 0) return 0; const months = Math.max(1, Math.round(years * 12)); const r = annualRate / 100 / 12; return r === 0 ? principal / months : principal * r * Math.pow(1+r, months) / (Math.pow(1+r, months)-1); };
  const futureMonthly = (payment, annualReturn, months) => { const r = annualReturn / 100 / 12; if (payment <= 0 || months <= 0) return 0; return r === 0 ? payment * months : payment * (Math.pow(1+r, months)-1) / r; };
  const loanSnapshot = (principal, annualRate, years, monthlyExtra, horizonMonths) => { const payment = annuity(principal, annualRate, years) + monthlyExtra; const r = annualRate / 100 / 12; let balance = principal, interest = 0, paid = 0; for (let m=0; m<horizonMonths && balance>0.01; m++) { const i=balance*r; const actual=Math.min(payment,balance+i); balance=Math.max(0,balance-Math.max(0,actual-i)); interest+=i; paid+=actual; } return {balance,interest,paid,payment}; };
  const totalLoanCost = (principal, annualRate, years, feeMonthly=0) => { const months=Math.max(1,Math.round(years*12)); const payment=annuity(principal,annualRate,years); return {payment:payment+feeMonthly,total:(payment+feeMonthly)*months,interest:Math.max(0,payment*months-principal)}; };

  function extraDebtOrSaving(){
    const balance=value('edsBalance'), rate=value('edsLoanRate'), years=value('edsLoanYears'), extra=value('edsExtra'), horizon=Math.min(Math.round(value('edsHorizon')*12),Math.round(years*12));
    const base=loanSnapshot(balance,rate,years,0,horizon), debt=loanSnapshot(balance,rate,years,extra,horizon), savings=futureMonthly(extra,value('edsSavingReturn'),horizon);
    const debtAdv=base.balance-debt.balance, savingAdv=savings, diff=Math.abs(debtAdv-savingAdv), saveWins=savingAdv>debtAdv;
    set('resultTitle',saveWins?'Sparing gir høyest forventet verdi':'Ekstra nedbetaling gir høyest verdi'); set('resultSummary',`${saveWins?'Sparing':'Ekstra nedbetaling'} ligger omtrent ${kr(diff)} foran etter ${duration(horizon)} med disse forutsetningene.`); set('primaryResult',kr(diff));
    set('edsDebtBalance',kr(debt.balance)); set('edsBaseBalance',kr(base.balance)); set('edsSavingsValue',kr(savings)); set('edsInterestSaved',kr(Math.max(0,base.interest-debt.interest))); warning(value('edsSavingReturn')>10?'Høy forventet avkastning gir et optimistisk resultat. Vurder også et mer forsiktig scenario.':'');
  }
  function fixedOrFloating(){
    const balance=value('ffBalance'), years=value('ffYears'), binding=Math.min(value('ffBinding'),years), fixed=value('ffFixedRate'), floating=value('ffFloatingRate'), fees=value('ffFixedFees'), months=Math.round(binding*12);
    const fs=loanSnapshot(balance,fixed,years,0,months), fl=loanSnapshot(balance,floating,years,0,months); const fixedCost=fs.paid+fees+fs.balance, floatCost=fl.paid+fl.balance; const diff=Math.abs(fixedCost-floatCost), fixedWins=fixedCost<floatCost;
    const breakEven=fixed+(fees/Math.max(1,balance*binding))*100;
    set('resultTitle',fixedWins?'Fastrente ser billigst ut':'Flytende rente ser billigst ut'); set('resultSummary',`${fixedWins?'Fastrente':'Flytende rente'} er omtrent ${kr(diff)} rimeligere gjennom bindingsperioden med valgt gjennomsnittsrente.`); set('primaryResult',kr(diff));
    set('ffFixedPayment',`${kr(fs.payment)} / mnd`); set('ffFloatingPayment',`${kr(fl.payment)} / mnd`); set('ffBreakEven',`${decimal.format(breakEven)} %`); set('ffPeriodCost',kr(diff)); warning('');
  }
  function refinancing(){
    const balance=value('refBalance'); const old=totalLoanCost(balance,value('refOldRate'),value('refOldYears'),value('refOldFee')); const neu=totalLoanCost(balance,value('refNewRate'),value('refNewYears'),value('refNewFee')); const upfront=value('refSetup')+value('refExit'); const totalNew=neu.total+upfront; const totalDiff=old.total-totalNew; const monthlySaving=old.payment-neu.payment; const breakEven=monthlySaving>0?Math.ceil(upfront/monthlySaving):null;
    set('resultTitle',totalDiff>0?'Refinansiering ser lønnsomt ut':'Dagens lån ser billigst ut'); set('resultSummary',totalDiff>0?`Det nye tilbudet kan spare omtrent ${kr(totalDiff)} totalt.`:`Det nye tilbudet blir omtrent ${kr(Math.abs(totalDiff))} dyrere totalt med valgt løpetid.`); set('primaryResult',kr(Math.abs(totalDiff)));
    set('refOldMonthly',`${kr(old.payment)} / mnd`); set('refNewMonthly',`${kr(neu.payment)} / mnd`); set('refBreakEven',breakEven===null?'Ikke tjent inn':duration(breakEven)); set('refTotalDifference',`${totalDiff>=0?'+':'−'} ${kr(Math.abs(totalDiff))}`); warning(value('refNewYears')>value('refOldYears')?'Den nye løpetiden er lengre. Lavere månedsbeløp kan derfor skjule høyere total kostnad.':'');
  }
  function roomRental(){
    const months=Math.min(12,value('rentRoomMonths')), gross=value('rentRoomMonthly')*months, costs=value('rentRoomUtilities')*months+value('rentRoomMaintenance')+value('rentRoomInsurance')+value('rentRoomOther'); const tax=gross*value('rentRoomTaxableShare')/100*value('rentRoomTaxRate')/100; const net=gross-costs-tax;
    set('resultTitle',net>=0?'Utleien gir et positivt bidrag':'Kostnadene er høyere enn leien'); set('resultSummary',`Netto anslag er ${kr(net/12)} per måned fordelt over hele året.`); set('primaryResult',`${kr(net/12)} / mnd`); set('rentRoomGross',kr(gross)); set('rentRoomCosts',kr(costs)); set('rentRoomTax',kr(tax)); set('rentRoomMargin',gross?`${decimal.format(net/gross*100)} %`:'0 %'); warning(value('rentRoomTaxableShare')===0?'Skattepliktig andel er satt til 0 %. Kontroller at dette passer din situasjon.':'');
  }
  function studentBudget(){
    const income=value('stuSupport')+value('stuJob')+value('stuOtherIncome'); const expenses=['stuRent','stuUtilities','stuFood','stuTransport','stuStudy','stuPhone','stuSocial','stuOther'].reduce((s,id)=>s+value(id),0); const left=income-expenses;
    set('resultTitle',left>=0?'Studentbudsjettet går rundt':'Budsjettet går i minus'); set('resultSummary',left>=0?`Du har omtrent ${kr(left)} igjen hver måned.`:`Du mangler omtrent ${kr(Math.abs(left))} per måned.`); set('primaryResult',`${left>=0?'+':'−'} ${kr(Math.abs(left))}`); set('stuExpenses',`${kr(expenses)} / mnd`); set('stuDaily',`${kr(Math.max(0,left)*12/365)} / dag`); set('stuNeedIncome',left<0?kr(Math.abs(left)):'0 kr'); set('stuHousingShare',income?`${decimal.format((value('stuRent')+value('stuUtilities'))/income*100)} %`:'–'); warning(left<0?'Juster utgifter eller inntekter, og test også måneder med lavere utbetaling.':'');
  }
  function freelanceRate(){
    const salary=value('freeSalary'), hours=value('freeBillableHours')*value('freeWeeks'), pension=salary*value('freePension')/100, buffer=salary*value('freeBuffer')/100, revenue=salary+pension+buffer+value('freeCosts'), hourly=hours?revenue/hours:0;
    set('resultTitle','En timepris som dekker mer enn lønn'); set('resultSummary',`Du må fakturere omtrent ${kr(hourly)} per fakturerbar time for å nå målet.`); set('primaryResult',`${kr(hourly)} / time`); set('freeRevenue',kr(revenue)); set('freeMonthlyInvoice',`${kr(revenue/12)} / mnd`); set('freeBillableTotal',`${money.format(hours)} timer`); set('freeTaxAmount',kr(salary*value('freeTaxReserve')/100)); warning(value('freeBillableHours')>35?'Et høyt antall fakturerbare timer kan være vanskelig når administrasjon og salg også skal gjøres.':'');
  }
  function evCharging(){
    const energy=value('evKm')*value('evConsumption')/100, homeShare=Math.min(100,value('evHomeShare'))/100, chargerAnnual=value('evChargerCost')/Math.max(1,value('evChargerYears')); const mixed=energy*(homeShare*value('evHomePrice')+(1-homeShare)*value('evPublicPrice'))+chargerAnnual+value('evSubscriptions'); const allPublic=energy*value('evPublicPrice')+value('evSubscriptions'); const saving=allPublic-mixed; const operationalSaving=energy*homeShare*(value('evPublicPrice')-value('evHomePrice')); const payback=operationalSaving>0?value('evChargerCost')/operationalSaving:null;
    set('resultTitle',saving>=0?'Hjemmelading reduserer kostnaden':'Ladeboksen er dyr med disse tallene'); set('resultSummary',`Din lademiks koster omtrent ${kr(mixed)} per år inkludert fordelt ladeboks.`); set('primaryResult',kr(mixed)); set('evEnergy',`${money.format(energy)} kWh`); set('evAllPublic',kr(allPublic)); set('evAnnualSaving',`${saving>=0?'+':'−'} ${kr(Math.abs(saving))}`); set('evPayback',payback===null?'Ikke beregnet':`${decimal.format(payback)} år`); warning('');
  }
  function cabin(){
    const loan=annuity(value('cabinLoan'),value('cabinRate'),value('cabinYears')); const running=['cabinMunicipal','cabinElectricity','cabinInsurance','cabinMaintenance','cabinTravel','cabinInternet','cabinOther'].reduce((s,id)=>s+value(id),0); const annual=loan*12+running; const days=Math.max(1,value('cabinDays'));
    set('resultTitle','Hytta har en tydelig årskostnad'); set('resultSummary',`Med ${money.format(days)} bruksdøgn blir kostnaden omtrent ${kr(annual/days)} per døgn.`); set('primaryResult',`${kr(annual/12)} / mnd`); set('cabinAnnual',kr(annual)); set('cabinPerNight',kr(annual/days)); set('cabinLoanPayment',`${kr(loan)} / mnd`); set('cabinRunning',kr(running)); warning('');
  }
  function drivingLicence(){
    const lessons=value('licLessons')*value('licLessonPrice'), training=value('licCourses')+lessons+value('licPrivate'), total=training+value('licTheory')+value('licTest')+value('licExtra'), remaining=Math.max(0,total-value('licSavings')), months=Math.max(1,value('licMonths'));
    set('resultTitle',remaining?'En konkret spareplan':'Førerkortet er finansiert'); set('resultSummary',remaining?`Du må spare omtrent ${kr(remaining/months)} per måned.`:'Oppspart beløp dekker estimert totalpris.'); set('primaryResult',kr(total)); set('licLessonsTotal',kr(lessons)); set('licRemaining',remaining?kr(remaining):'Dekket'); set('licMonthlySaving',remaining?`${kr(remaining/months)} / mnd`:'0 kr'); set('licTrainingShare',total?`${decimal.format(training/total*100)} %`:'0 %'); warning('');
  }
  function separation(){
    const income=value('sepIncome'), expenses=['sepHousing','sepUtilities','sepFood','sepTransport','sepChildren','sepDebt','sepInsurance','sepOther'].reduce((s,id)=>s+value(id),0), left=income-expenses, gap=Math.max(0,value('sepStartup')-value('sepSavings'));
    set('resultTitle',left>=0?'Månedsbudsjettet går rundt':'Det mangler penger hver måned'); set('resultSummary',left>=0?`Du har omtrent ${kr(left)} igjen etter de oppgitte utgiftene.`:`Du mangler omtrent ${kr(Math.abs(left))} per måned.`); set('primaryResult',`${left>=0?'+':'−'} ${kr(Math.abs(left))}`); set('sepExpenses',`${kr(expenses)} / mnd`); set('sepNeededIncome',kr(expenses)); set('sepStartupGap',gap?kr(gap):'Dekket'); set('sepHousingShare',income?`${decimal.format((value('sepHousing')+value('sepUtilities'))/income*100)} %`:'–'); warning(left<0?'Lag en konkret plan for bolig, gjeld og nødvendige utgifter før du binder deg til nye avtaler.':'');
  }
  function overtime(){
    const baseHourly=value('otGrossMonthly')/Math.max(1,value('otNormalHours')), gross=baseHourly*(1+value('otSupplement')/100)*value('otHours'), net=gross*(1-value('otTax')/100)-value('otCosts'), perHour=value('otHours')?net/value('otHours'):0, free=value('otFreeHourValue')*value('otHours'), diff=net-free;
    set('resultTitle',diff>=0?'Overtiden slår din verdi på fritiden':'Fritiden er mer verdt for deg'); set('resultSummary',`Netto utbytte er omtrent ${kr(perHour)} per overtidstime etter skatt og ekstrakostnader.`); set('primaryResult',`${kr(perHour)} / time`); set('otGrossExtra',kr(gross)); set('otNetTotal',kr(net)); set('otFreeValue',kr(free)); set('otDifference',`${diff>=0?'+':'−'} ${kr(Math.abs(diff))}`); warning(net<0?'Ekstrakostnadene er høyere enn netto overtidsbetaling med disse tallene.':'');
  }
  function unpaidLeave(){
    const lost=value('leaveLostIncome'), other=value('leaveOtherIncome'), expenses=Math.max(0,value('leaveExpenses')-value('leaveCut')), gap=Math.max(0,expenses-other), incomeDrop=Math.max(0,lost-other), months=value('leaveMonths'), needed=gap*months+value('leaveExtraReserve'), buffer=value('leaveBuffer'), remaining=buffer-gap*months;
    set('resultTitle',buffer>=needed?'Bufferen dekker planen':'Du trenger en større buffer'); set('resultSummary',buffer>=needed?`Inntekten faller med omtrent ${kr(incomeDrop)} per måned, og bufferen dekker beregnet forbruksgap med sikkerhetsmargin.`:`Du mangler omtrent ${kr(needed-buffer)} for hele perioden etter andre inntekter og planlagte kutt.`); set('primaryResult',kr(needed)); set('leaveMonthlyGap',`${kr(gap)} / mnd`); set('leaveCoverage',gap?duration(buffer/gap):'Ingen gap'); set('leaveRemaining',`${remaining>=0?'+':'−'} ${kr(Math.abs(remaining))}`); set('leaveCutSaving',kr(value('leaveCut')*months)); warning('');
  }
  function interestStress(){
    const current=annuity(value('stressBalance'),value('stressRate'),value('stressYears')), stressed=annuity(value('stressBalance'),value('stressRate')+value('stressAdd'),value('stressYears')), diff=stressed-current, totalHousing=stressed+value('stressOtherHousing'), share=value('stressIncome')?totalHousing/value('stressIncome')*100:0;
    set('resultTitle',`Renteøkningen gir ${kr(diff)} mer per måned`); set('resultSummary',`Lån og andre bokostnader vil bruke omtrent ${decimal.format(share)} % av nettoinntekten.`); set('primaryResult',`${kr(diff)} / mnd`); set('stressCurrentPayment',`${kr(current)} / mnd`); set('stressNewPayment',`${kr(stressed)} / mnd`); set('stressAnnualIncrease',kr(diff*12)); set('stressIncomeShare',`${decimal.format(share)} %`); warning(share>45?'En stor del av nettoinntekten går til bolig i dette scenarioet. Test et enda mer forsiktig budsjett.':'');
  }
  function guarantor(){
    const responsibility=value('guarLoan')*Math.min(100,value('guarShare'))/100, payment=annuity(responsibility,value('guarRate'),value('guarYears')), combined=responsibility+value('guarOwnDebt'), totalPayment=payment+value('guarOwnPayment'), share=value('guarIncome')?totalPayment/value('guarIncome')*100:0, headroom=value('guarIncome')-totalPayment;
    set('resultTitle','Et ansvar som bør være helt tydelig'); set('resultSummary',`Garantiandelen tilsvarer omtrent ${kr(responsibility)} og et stresstestet månedsbeløp på ${kr(payment)}.`); set('primaryResult',kr(responsibility)); set('guarStressPayment',`${kr(payment)} / mnd`); set('guarCombinedDebt',kr(combined)); set('guarPaymentShare',`${decimal.format(share)} %`); set('guarHeadroom',`${headroom>=0?'+':'−'} ${kr(Math.abs(headroom))}`); warning(share>50?'Mulige lånebetalinger bruker over halvparten av nettoinntekten i dette scenarioet.':'');
  }
  function solar(){
    const years=Math.max(1,value('solarYears')), self=Math.min(100,value('solarSelfUse'))/100, deg=Math.min(20,value('solarDegradation'))/100; let production=value('solarProduction'), total=0, first=0, payback=null, cumulative=0;
    for(let y=1;y<=years;y++){ const benefit=production*(self*value('solarOwnValue')+(1-self)*value('solarSellPrice'))-value('solarMaintenance'); if(y===1)first=benefit; total+=benefit; cumulative+=benefit; if(payback===null&&cumulative>=value('solarCost'))payback=y; production*=1-deg; }
    const net=total-value('solarCost'); set('resultTitle',payback?`Anlegget er nedbetalt etter omtrent ${payback} år`:'Investeringen er ikke nedbetalt i perioden'); set('resultSummary',`Netto verdi over ${years} år er ${net>=0?kr(net):`minus ${kr(Math.abs(net))}`}.`); set('primaryResult',payback?`${payback} år`:`Over ${years} år`); set('solarFirstBenefit',kr(first)); set('solarTotalBenefit',kr(total)); set('solarNet',`${net>=0?'+':'−'} ${kr(Math.abs(net))}`); set('solarReturn',value('solarCost')?`${decimal.format(net/value('solarCost')*100)} %`:'–'); warning(first<=0?'Årlige kostnader er høyere enn beregnet energiverdi første år.':'');
  }
  function heatPump(){
    const years=Math.max(1,value('heatLifetime')), energy=value('heatCurrentEnergy')*Math.min(100,value('heatSavingPct'))/100, growth=raw('heatPriceGrowth')/100; let price=value('heatPrice'), total=0, payback=null, cumulative=0, first=0;
    for(let y=1;y<=years;y++){ const saving=energy*price-value('heatMaintenance'); if(y===1)first=saving; total+=saving; cumulative+=saving; if(payback===null&&cumulative>=value('heatCost'))payback=y; price*=1+growth; }
    const net=total-value('heatCost'); set('resultTitle',payback?`Varmepumpen er nedbetalt etter omtrent ${payback} år`:'Ikke nedbetalt innen forventet levetid'); set('resultSummary',`Netto anslag over ${years} år er ${net>=0?kr(net):`minus ${kr(Math.abs(net))}`}.`); set('primaryResult',payback?`${payback} år`:`Over ${years} år`); set('heatEnergySaved',`${money.format(energy)} kWh`); set('heatAnnualSaving',kr(first)); set('heatLifetimeSaving',kr(total)); set('heatNetBenefit',`${net>=0?'+':'−'} ${kr(Math.abs(net))}`); warning(first<=0?'Vedlikeholdet er høyere enn beregnet energibesparelse første år.':'');
  }
  function newCity(){
    const oldLeft=value('cityOldIncome')-value('cityOldHousing')-value('cityOldTransport')-value('cityOldOther'), newLeft=value('cityNewIncome')-value('cityNewHousing')-value('cityNewTransport')-value('cityNewOther'), monthly=newLeft-oldLeft, move=value('cityMovingCost'), months=value('cityHorizon')*12, gain=monthly*months-move, breakEven=monthly>0?Math.ceil(move/monthly):null;
    set('resultTitle',monthly>=0?'Ny by gir mer igjen hver måned':'Dagens by gir mer igjen hver måned'); set('resultSummary',`Forskjellen er omtrent ${kr(Math.abs(monthly))} per måned før flyttekostnaden.`); set('primaryResult',`${monthly>=0?'+':'−'} ${kr(Math.abs(monthly))} / mnd`); set('cityOldLeft',`${kr(oldLeft)} / mnd`); set('cityNewLeft',`${kr(newLeft)} / mnd`); set('cityBreakEven',breakEven===null?'Ikke tjent inn':duration(breakEven)); set('cityPeriodGain',`${gain>=0?'+':'−'} ${kr(Math.abs(gain))}`); warning(monthly<=0?'Flyttekostnaden blir ikke tjent inn gjennom månedsøkonomien med disse tallene.':'');
  }
  function babyPackage(){
    const newNet=Math.max(0,value('babyNewPrice')-value('babyNewResale')), usedNet=Math.max(0,value('babyUsedPrice')+value('babyUsedCleaning')+value('babyReplacementRisk')-value('babyUsedResale')), diff=Math.abs(newNet-usedNet), usedWins=usedNet<newNet, months=Math.max(1,value('babyMonths'));
    set('resultTitle',`${usedWins?'Brukt':'Nytt'} ser billigst ut`); set('resultSummary',`${usedWins?'Brukt':'Nytt'} er omtrent ${kr(diff)} rimeligere gjennom den valgte brukstiden.`); set('primaryResult',kr(diff)); set('babyNewNet',kr(newNet)); set('babyUsedNet',kr(usedNet)); set('babyMonthlyDiff',`${kr(diff/months)} / mnd`); set('babyResaleDifference',kr(Math.abs(value('babyNewResale')-value('babyUsedResale')))); warning('');
  }
  function secondPet(){
    const startup=value('pet2Purchase')+value('pet2Equipment')+value('pet2Training'), annual=Math.max(0,(value('pet2Food')+value('pet2Insurance')-value('pet2Discount'))*12+value('pet2Vet')+value('pet2Care')), first=startup+annual, years=Math.max(1,value('pet2Years')), long=startup+annual*years;
    set('resultTitle','Dyr nummer to har en tydelig merkostnad'); set('resultSummary',`Et vanlig år koster omtrent ${kr(annual)}, eller ${kr(annual/12)} per måned.`); set('primaryResult',kr(first)); set('pet2NormalYear',kr(annual)); set('pet2Monthly',`${kr(annual/12)} / mnd`); set('pet2LongTerm',kr(long)); set('pet2Startup',kr(startup)); warning('');
  }
  function confirmation(){
    const base=value('confGuests')*value('confFood')+value('confVenue')+value('confClothes')+value('confPhoto')+value('confDecor')+value('confActivities'), buffer=base*value('confBufferPct')/100, total=base+buffer, remaining=Math.max(0,total-value('confSavings')), months=Math.max(1,value('confMonths'));
    set('resultTitle',remaining?'En konkret spareplan':'Konfirmasjonen er finansiert'); set('resultSummary',remaining?`Spar omtrent ${kr(remaining/months)} per måned frem til dagen.`:'Oppspart beløp dekker estimert budsjett.'); set('primaryResult',kr(total)); set('confPerGuest',value('confGuests')?kr(total/value('confGuests')):'–'); set('confBuffer',kr(buffer)); set('confRemaining',remaining?kr(remaining):'Dekket'); set('confMonthlySaving',remaining?`${kr(remaining/months)} / mnd`:'0 kr'); warning('');
  }
  function christmas(){
    const gifts=value('xmasPeople')*value('xmasGiftAvg'), total=gifts+value('xmasFood')+value('xmasTravel')+value('xmasEvents')+value('xmasDecor')+value('xmasOther'), remaining=Math.max(0,total-value('xmasSavings')), months=Math.max(1,value('xmasMonths'));
    set('resultTitle',remaining?'Fordel julekostnaden over flere måneder':'Julebudsjettet er finansiert'); set('resultSummary',remaining?`Du må spare omtrent ${kr(remaining/months)} per måned.`:'Oppspart beløp dekker estimert julebudsjett.'); set('primaryResult',kr(total)); set('xmasGifts',kr(gifts)); set('xmasRemaining',remaining?kr(remaining):'Dekket'); set('xmasMonthlySaving',remaining?`${kr(remaining/months)} / mnd`:'0 kr'); set('xmasPerPerson',value('xmasPeople')?kr(gifts/value('xmasPeople')):'–'); warning('');
  }
  function cashOrFinance(){
    const price=value('cashPrice'), down=Math.min(price,value('cashDown')), loan=Math.max(0,price-down), years=value('cashYears'), months=years*12, payment=annuity(loan,value('cashRate'),years), financeCost=Math.max(0,payment*months-loan)+value('cashFees'), retained=Math.max(0,loan-value('cashBufferNeeded')), potential=retained*(Math.pow(1+value('cashReturn')/100,years)-1), diff=Math.abs(financeCost-potential), financeWins=potential>financeCost;
    set('resultTitle',financeWins?'Finansiering kan gi høyere forventet verdi':'Kontantkjøp ser billigst ut'); set('resultSummary',`${financeWins?'Mulig avkastning':'Renter og gebyrer'} ligger omtrent ${kr(diff)} høyere over perioden.`); set('primaryResult',kr(diff)); set('cashLoanAmount',kr(loan)); set('cashFinanceCost',kr(financeCost)); set('cashPotentialReturn',kr(potential)); set('cashMonthlyPayment',`${kr(payment)} / mnd`); warning(value('cashReturn')>value('cashRate')?'Avkastningen er usikker, mens lånerenten er en reell kostnad. Test også lavere avkastning.':'');
  }
  function simulateCard(balance,annualRate,monthlyFee,paymentFn){ const r=annualRate/100/12; let b=balance, interest=0, months=0; while(b>0.01&&months<1200){ const i=b*r+monthlyFee; const p=Math.min(b+i,Math.max(0,paymentFn(b))); if(p<=i+0.01)return null; b=Math.max(0,b-(p-i)); interest+=i; months++; } return months>=1200?null:{months,interest}; }
  function creditCard(){
    const balance=value('ccBalance'), rate=value('ccRate'), fee=value('ccMonthlyFee'); const planned=simulateCard(balance,rate,fee,()=>value('ccPayment')); const minimum=simulateCard(balance,rate,fee,b=>Math.max(value('ccMinFloor'),b*value('ccMinPct')/100));
    if(!planned||!minimum){ set('resultTitle','Betalingen er for lav'); set('resultSummary','Månedsbeløpet må være høyere enn renter og gebyrer for at saldoen skal falle.'); set('primaryResult','Ikke nedbetalt'); ['ccPlannedTime','ccMinimumTime','ccInterestSaved','ccMonthsSaved'].forEach(id=>set(id,'–')); warning('Øk månedsbetalingen eller kontroller renten og gebyrene.'); return; }
    const saved=Math.max(0,minimum.interest-planned.interest), monthsSaved=Math.max(0,minimum.months-planned.months); set('resultTitle',`Gjeldsfri på ${duration(planned.months)}`); set('resultSummary',`Din faste betaling sparer omtrent ${kr(saved)} i renter sammenlignet med minstebetaling.`); set('primaryResult',kr(planned.interest)); set('ccPlannedTime',duration(planned.months)); set('ccMinimumTime',duration(minimum.months)); set('ccInterestSaved',kr(saved)); set('ccMonthsSaved',duration(monthsSaved)); warning('');
  }
  function salaryRaise(){
    const gross=value('raiseNewGross')-value('raiseOldGross'), afterTax=gross*(1-value('raiseTax')/100), net=afterTax+raw('raiseBenefits')-value('raiseCosts'), oldNetApprox=value('raiseOldGross')*(1-value('raiseTax')/100), pct=oldNetApprox?net/oldNetApprox*100:0;
    set('resultTitle',net>=0?'Lønnsøkningen gir mer igjen':'Andre endringer spiser opp lønnsøkningen'); set('resultSummary',`Anslått endring etter skatt, goder og kostnader er ${net>=0?kr(net):`minus ${kr(Math.abs(net))}`} per måned.`); set('primaryResult',`${net>=0?'+':'−'} ${kr(Math.abs(net))}`); set('raiseGrossIncrease',kr(gross)); set('raiseAnnualNet',`${net>=0?'+':'−'} ${kr(Math.abs(net*12))}`); set('raisePerHour',`${net>=0?'+':'−'} ${kr(Math.abs(net/Math.max(1,value('raiseHours'))))}`); set('raiseNetPct',`${decimal.format(pct)} %`); warning(gross<0?'Ny bruttolønn er lavere enn dagens lønn.':'');
  }
  function homeOffice(){
    const days=Math.min(5,value('homeOfficeDays')), weeks=value('homeOfficeWeeks'), officeDay=value('homeOfficeTransport')+value('homeOfficeParking')+value('homeOfficeLunch'), homeDay=value('homeOfficeEnergy')+value('homeOfficeHomeLunch'), annual=(officeDay-homeDay)*days*weeks-value('homeOfficeEquipment')*12, monthly=annual/12, time=value('homeOfficeMinutes')/60*days*weeks;
    set('resultTitle',annual>=0?'Hjemmekontor sparer direkte kostnader':'Hjemmekontor koster mer med disse tallene'); set('resultSummary',`Forskjellen er omtrent ${kr(Math.abs((officeDay-homeDay)))} per hjemmedag før månedlig utstyr.`); set('primaryResult',`${annual>=0?'+':'−'} ${kr(Math.abs((officeDay-homeDay)))} / dag`); set('homeOfficeMonthlySaving',`${monthly>=0?'+':'−'} ${kr(Math.abs(monthly))}`); set('homeOfficeAnnualSaving',`${annual>=0?'+':'−'} ${kr(Math.abs(annual))}`); set('homeOfficeTime',`${decimal.format(time)} timer`); set('homeOfficeOfficeDay',kr(officeDay)); warning('');
  }

  const calculators={
    'ekstra-nedbetaling-eller-sparing':extraDebtOrSaving,'fastrente-eller-flytende':fixedOrFloating,'refinansiering':refinancing,'utleie-av-rom':roomRental,'studentbudsjett':studentBudget,'frilans-timepris':freelanceRate,'elbillading':evCharging,'hyttekalkulator':cabin,'forerkort':drivingLicence,'alene-etter-samlivsbrudd':separation,'overtid-eller-fritid':overtime,'ulonnet-permisjon':unpaidLeave,'rentestress':interestStress,'kausjonist-medlantaker':guarantor,'solceller':solar,'varmepumpe':heatPump,'flytting-ny-by':newCity,'babypakke-nytt-eller-brukt':babyPackage,'dyr-nummer-to':secondPet,'konfirmasjon':confirmation,'julebudsjett':christmas,'kontant-eller-finansiering':cashOrFinance,'kredittkort-pris':creditCard,'lonnsokningens-verdi':salaryRaise,'hjemmekontor-eller-kontor':homeOffice
  };
  const calculate=calculators[type]; if(!calculate)return;
  form.addEventListener('submit',e=>{e.preventDefault();calculate();}); form.addEventListener('input',calculate); form.addEventListener('change',calculate);
  document.querySelector('[data-reset-calculator]')?.addEventListener('click',()=>{form.reset();calculate();}); calculate();
})();
