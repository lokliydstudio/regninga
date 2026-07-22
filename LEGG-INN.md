# Banken – lokal søkemotor

Denne oppdateringen fjerner KI-funksjonen helt og gjør Banken til et lokalt søk på Regninga.

## Slik installerer du

1. Pakk ut ZIP-filen.
2. Kopier alle filene og mappene til roten av GitHub-prosjektet for regninga.no.
3. Godta overskriving av eksisterende filer.
4. Commit og push endringene til GitHub Pages.

## Dette er endret

- OpenAI- og Cloudflare-koblingen er fjernet.
- `banken-config.js` brukes ikke lenger.
- Banken søker kun i en lokal liste over kalkulatorene.
- Forsiden har fått en søkeboks.
- Ved et tydelig treff sendes brukeren rett til kalkulatoren.
- Ved flere mulige treff åpnes Banken med en kort resultatliste.
- Ingen søketekst sendes til eksterne tjenester.

Du kan slette gamle KI-filer fra prosjektet dersom de finnes:

- `assets/banken-config.js`
- eventuell mappe med Cloudflare Worker-kode

API-nøkkelen bør også slettes eller deaktiveres i OpenAI dersom den ikke skal brukes andre steder.
