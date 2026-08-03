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
