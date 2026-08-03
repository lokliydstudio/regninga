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

Manuelle annonseenheter er aktivert i `assets/ads-config.js` med den oppgitte slot-ID-en. Annonsefeltene skjules automatisk dersom konfigurasjonen mangler eller AdSense-scriptet ikke lastes.

## Innhold

Nettstedet inneholder 49 kalkulatorer/verktøy, blant annet:

- `/rentesjekken/` – sammenlign eget boliglån med banktilbud
- `/leie-eller-kjope/`, `/flytte-hjemmefra/` og `/gjeldsfri/`
- `/buffer/`, `/abonnementssjekken/` og `/matbudsjett/`
- `/ny-jobb/`, `/jobb-mindre/` og `/pensjon/`
- `/oppussing/`, `/hvor-mye-bolig/` og `/bolig/`
- `/bryllup/`, `/feriebudsjett/` og `/nytt-eller-brukt/`
- `/forsikringssjekken/`, `/bil/`, `/pendling/` og `/strom/`
- `/samboer/`, `/hund/`, `/barn/` og `/banken/`
- `personvern.html` og `kontakt.html`

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
- `assets/new-calculators.js` – beregninger for nyere kalkulatorer
- `assets/more-calculators.js` – beregninger for valg- og planleggingskalkulatorer
- `assets/rentesjekken.js` – rentesammenligning, rangering og forhandlingsmelding

## Felles design og funksjonalitet

Alle sider bruker den samme Liquid Glass-designprofilen i `assets/styles.css`. Forsiden, hovedsøket, Banken og `sitemap.xml` inneholder alle kalkulatorene. Beregningene skjer lokalt i nettleseren.


## Nye valg- og planleggingskalkulatorer

- `/ekstra-nedbetaling-eller-sparing/` – Ekstra nedbetaling eller sparing?
- `/fastrente-eller-flytende/` – Fastrente eller flytende rente?
- `/refinansiering/` – Refinansieringskalkulator
- `/utleie-av-rom/` – Utleie av rom
- `/studentbudsjett/` – Studentbudsjett
- `/frilans-timepris/` – Frilans-timepris
- `/elbillading/` – Elbillading hjemme eller offentlig?
- `/hyttekalkulator/` – Hyttekalkulator
- `/forerkort/` – Førerkortkalkulator
- `/alene-etter-samlivsbrudd/` – Alene etter samlivsbrudd
- `/overtid-eller-fritid/` – Overtid eller fritid?
- `/ulonnet-permisjon/` – Ulønnet permisjon
- `/rentestress/` – Rentestress
- `/kausjonist-medlantaker/` – Kausjonist og medlåntaker
- `/solceller/` – Solceller – nedbetalingstid
- `/varmepumpe/` – Varmepumpe – lønner det seg?
- `/flytting-ny-by/` – Flytting til en ny by
- `/babypakke-nytt-eller-brukt/` – Babypakke – nytt eller brukt?
- `/dyr-nummer-to/` – Dyr nummer to
- `/konfirmasjon/` – Konfirmasjonsbudsjett
- `/julebudsjett/` – Julebudsjett
- `/kontant-eller-finansiering/` – Kontantkjøp eller finansiering?
- `/kredittkort-pris/` – Kredittkortets egentlige pris
- `/lonnsokningens-verdi/` – Lønnsøkningens verdi
- `/hjemmekontor-eller-kontor/` – Hjemmekontor eller kontor?


## Rentesjekken

`/rentesjekken/` kombinerer en lokal sammenligningsmotor med Finansportalens offisielle, integrerbare boliglånsoversikt. Besøkeren legger inn dagens lån og aktuelle banktilbud. Regninga beregner månedspris, total kostnad, mulig besparelse, brytningspunkt og en ferdig forhandlingsmelding.

Rådata fra Finansportalen er ikke hentet direkte. Maskinell feed krever distribusjonsavtale og autentisering. Se `RENTESJEKKEN-DATA.md`.
