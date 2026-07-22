# Fjern toppmenyen fra hele Regninga

Denne oppdateringen fjerner menyen med **Bolig, Bil, Pendling, Strøm, Samboer, Hund, Barn, Pensjon, Jobb mindre og Banken** fra alle HTML-sider.

## Slik gjør du

1. Pakk ut innholdet i roten av Regninga-prosjektet, der `index.html` ligger.
2. Åpne terminalen i prosjektmappen.
3. Kjør:

```bash
python fjern-toppmeny.py
```

Skriptet:

- går gjennom alle HTML-filene
- fjerner menyknapp, desktopmeny og mobilmeny fra headeren
- fjerner all tekst og alle lenker fra menyområdet
- legger inn en ren headerstil
- lager sikkerhetskopi i `.regninga-backup-for-menyfjerning`

Etterpå kan du slette `fjern-toppmeny.py` og denne veiledningen. Behold `assets/header-uten-meny.css`.

## GitHub Pages

Last opp de endrede HTML-filene og `assets/header-uten-meny.css`, og publiser som vanlig.
