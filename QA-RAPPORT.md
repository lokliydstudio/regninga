# Kvalitetskontroll

Kontrollert 3. august 2026:

- 54 HTML-filer totalt
- 49 kalkulatorer/verktøy på forsiden
- Rentesjekken lagt til på forsiden, i toppmenyen, hovedsøket, Banken og sitemap.xml
- Ingen brutte lokale lenker eller manglende lokale ressurser
- Ingen dupliserte HTML-ID-er
- JavaScript-syntaks kontrollert for alle JavaScript-filer
- Standardberegningen i Rentesjekken kontrollert mot annuitetsformelen
- Mobiltilpasning er definert med egne brytepunkter og tabellen kan rulles horisontalt

Rentesjekken beregner planleggingsanslag basert på brukerens egne forutsetninger. Finansportalens markedsoversikt er integrert som et separat, uendret iframe-verktøy. Ekstern lasting av iframe og annonser kunne ikke kjøres i den isolerte testserveren.

## UX-oppdatering

- 55 HTML-filer kontrollert.
- 49 verktøy fordelt på seks kategorier.
- Seks mest brukte verktøy vises direkte på forsiden.
- Ingen brutte lokale lenker eller ressurser funnet.
- Ingen dupliserte HTML-ID-er funnet.
- `site.js` og `home-search.js` består syntakskontroll.
- Forside og boligkalkulator er kontrollert i 1440 px og 390 px bredde uten horisontal overflow.
- Søke­forslag og åpning/lukking av kategorier er testet i nettleser.
