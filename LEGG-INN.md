# Gjør Banken til ekte KI

## 1. Kopier nettsidefilene
Kopier `banken/` og `assets/` til roten av Regninga-prosjektet. Godta overskriving.

## 2. Opprett OpenAI API-nøkkel
Opprett en prosjektbasert API-nøkkel i OpenAI-plattformen. Ikke legg nøkkelen i GitHub eller i JavaScript på nettsiden.

## 3. Publiser Cloudflare Worker
Installer Node.js, åpne terminalen i `cloudflare-worker/`, og kjør:

```bash
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Lim inn OpenAI-nøkkelen når Wrangler spør. Etter deploy får du en adresse som ligner:

```text
https://regninga-banken.ditt-navn.workers.dev
```

## 4. Koble nettsiden til Worker-adressen
Åpne `assets/banken-config.js` og erstatt:

```js
https://DIN-WORKER.workers.dev/api/banken
```

med Worker-adressen din pluss `/api/banken`, for eksempel:

```js
https://regninga-banken.ditt-navn.workers.dev/api/banken
```

Last deretter filene opp til GitHub Pages.

## Slik fungerer løsningen
- GitHub Pages viser søkesiden.
- Cloudflare Worker oppbevarer API-nøkkelen sikkert som en secret.
- Banken sender bare økonomiske spørsmål til OpenAI Responses API.
- Ikke-økonomiske spørsmål avvises.
- Lokal søkefunksjon peker fortsatt til relevante kalkulatorer dersom KI-tjenesten er nede.

## Kostnadskontroll
Sett et månedlig budsjett og bruksvarsler i OpenAI-kontoen. Worker-koden begrenser spørsmål til 500 tegn og svar til 500 output-tokens.
