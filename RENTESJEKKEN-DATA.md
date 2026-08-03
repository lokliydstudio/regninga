# Datakilde for Rentesjekken

Rentesjekken har to separate deler:

1. **Regningas lokale sammenligningsmotor** beregner kostnadene fra tall brukeren selv skriver inn. Ingen lånedata sendes til en server.
2. **Finansportalens boliglånsoversikt** vises som et uendret, integrerbart iframe-verktøy fra Forbrukerrådet.

## Hvorfor bankprisene ikke kopieres inn i en lokal JSON-fil

Finansportalens rådatafeed er tilgjengelig gjennom et autentisert REST-API. Bruk i eksterne applikasjoner krever en distribusjonsavtale, `clientId` og `clientSecret`. Hemmelighetene må aldri legges i JavaScript som sendes til nettleseren eller i et offentlig GitHub-repository.

## Senere automatisering

Etter inngått distribusjonsavtale kan renter hentes gjennom en serverfunksjon eller en planlagt GitHub Action som bruker GitHub Secrets. Den bør:

- hente data med kortlevd access token
- filtrere på relevante boliglånsprodukter og belåningsgrad
- skrive en datert, offentlig JSON-fil uten hemmeligheter
- vise «sist oppdatert» og lenke til bankens vilkår
- beholde tydelig kreditering til Finansportalen

Inntil dette er på plass, skal markedsprisene hentes fra det offisielle iframe-verktøyet og aktuelle tilbud kopieres manuelt inn i Rentesjekken.
