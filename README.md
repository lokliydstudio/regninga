# Regninga

Produksjonsklar, statisk nettside for `regninga.no`. Nettstedet kan publiseres direkte med GitHub Pages.

## Publisering med GitHub Pages

1. Last opp innholdet i denne mappen til roten av et GitHub-repository.
2. Åpne **Settings → Pages**.
3. Velg **Deploy from a branch**, deretter `main` og `/ (root)`.
4. Kontroller at DNS-oppsettet for `regninga.no` peker til GitHub Pages. `CNAME`-filen ligger allerede i prosjektet.
5. Aktiver HTTPS i GitHub Pages når domenet er verifisert.

## Google AdSense

Publisher-koden for `ca-pub-8834902676708293` ligger i `<head>` på alle HTML-sider. `ads.txt` ligger i roten. Automatiske annonser styres fra AdSense-kontoen.

Før annonser vises til besøkende i EØS, Storbritannia og Sveits, publiser en europeisk samtykkemelding under **AdSense → Personvern og meldinger** med Googles sertifiserte CMP.

Manuelle annonseenheter kan senere aktiveres i `assets/ads-config.js` ved å legge inn slot-ID-er og sette `manualPlacements` til `true`. Tomme annonsefelt er skjult.

## Innhold

- `/bolig/`
- `/bil/`
- `/pendling/`
- `/strom/`
- `/samboer/`
- `/hund/`
- `/barn/`
- `/pensjon/`
- `personvern.html`
- `kontakt.html`

## Viktige filer

- `CNAME` – eget domene
- `robots.txt` – søkemotorinstruksjoner
- `sitemap.xml` – sidekart
- `ads.txt` – autorisert AdSense-utgiver
- `assets/styles.css` – design og responsivitet
- `assets/site.js` – mobilmeny og felles funksjoner
- `assets/app.js` – standardkalkulatorer
- `assets/strom.js` – strømpris og strømkalkulatorer
- `assets/pensjon.js` – pensjonsscenarioer
