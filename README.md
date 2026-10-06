# threadcheck

Browserextensie voor Threads die met een bolletje voor de gebruikersnaam laat zien of een account echt meedoet:

- 🟢 heeft binnen de ingestelde periode op iemand anders gereageerd
- 🔴 geen replies, of de laatste reply is ouder dan de periode
- 🟠 controle mislukt (wordt na 15 minuten opnieuw geprobeerd)
- ⚪ nog in de wachtrij

Handig om accounts te herkennen die alleen vanuit Instagram doorposten zonder deel te nemen. Klik op een bolletje om een account handmatig groen of rood te maken. Rode accounts kun je via het extensiemenu verbergen.

De extensie haalt per account `/@naam/replies` op vanuit je geopende Threads-tab en leest de replydatums uit de gegevens die Threads in die pagina meestuurt. Geen tabs, geen frames, geen server, geen API-sleutel. Alles blijft lokaal in je browser.

## Installeren

**Chrome (pc):** `chrome://extensions` → Ontwikkelaarsmodus aan → Uitgepakte extensie laden → kies de map `threads-activity-filter`.

**Firefox (pc en Android):** installeer het ondertekende `.xpi`-bestand. Op de pc via Add-ons → tandwiel → Add-on installeren via bestand. Op Android via Instellingen → Over Firefox → 5× op het logo tikken → Extensie installeren uit bestand. Werkt alleen in de browser op threads.com, niet in de Threads-app.

## Bouwen

```bash
python bouw.py
```

Maakt in `dist/` een Chrome-zip en een Firefox-zip. De Firefox-zip moet eenmalig per versie worden ondertekend via [addons.mozilla.org](https://addons.mozilla.org/developers/) met de keuze *On your own*.

Zie [LEESMIJ.txt](threads-activity-filter/LEESMIJ.txt) voor de volledige versiegeschiedenis en details.
