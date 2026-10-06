# threadcheck

Browserextensie voor Threads die met een bolletje voor de gebruikersnaam laat zien of een account echt meedoet:

- 🟢 heeft binnen de ingestelde periode op iemand anders gereageerd
- 🔴 geen replies, of de laatste reply is ouder dan de periode
- 🟠 controle mislukt (wordt na 15 minuten opnieuw geprobeerd)
- ⚪ nog in de wachtrij

Handig om accounts te herkennen die alleen vanuit Instagram doorposten zonder deel te nemen. Klik op een bolletje om een account handmatig groen of rood te maken. Rode accounts kun je via het extensiemenu verbergen.

De extensie haalt per account `/@naam/replies` op vanuit je geopende Threads-tab en leest de replydatums uit de gegevens die Threads in die pagina meestuurt. Geen tabs, geen frames, geen server, geen API-sleutel. Alles blijft lokaal in je browser.

## Installeren

Download de nieuwste versie bij [Releases](https://github.com/blyoco/threadcheck/releases/latest).

**Firefox (pc en Android)** – `threadcheck-firefox.xpi`. Werkt zichzelf daarna automatisch bij.
- Pc: Add-ons (`about:addons`) → tandwiel → *Add-on installeren via bestand*.
- Android: Instellingen → Over Firefox → tik 5× op het logo → terug naar Instellingen → *Extensie installeren uit bestand*. Werkt alleen in de browser op threads.com, niet in de Threads-app.

**Chrome (pc)** – `threadcheck-chrome.zip` uitpakken → `chrome://extensions` → Ontwikkelaarsmodus aan → *Uitgepakte extensie laden* → kies de uitgepakte map. Chrome werkt een losse extensie niet automatisch bij: download bij een nieuwe versie opnieuw.

## Nieuwe versie uitbrengen

1. Verhoog `version` in [manifest.json](threads-activity-filter/manifest.json).
2. Commit en push naar `main`.

De workflow [Release](.github/workflows/release.yml) bouwt dan beide versies, laat de Firefox-versie door Mozilla ondertekenen (niet openbaar), maakt een GitHub-release en zet de versie in [updates.json](updates.json). Firefox-gebruikers krijgen de update vanzelf binnen een dag.

**Eenmalige instelling:**
1. Maak op [addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/developers/addon/api/key/) API-sleutels aan.
2. Zet ze in deze repo onder *Settings → Secrets and variables → Actions* als `AMO_JWT_ISSUER` (JWT issuer) en `AMO_JWT_SECRET` (JWT secret).
3. Start de workflow één keer via *Actions → Release → Run workflow*.

Automatische updates werken alleen als de repo openbaar is, want Firefox moet `updates.json` en de releases zonder inloggen kunnen ophalen.

Lokaal bouwen kan ook met `python bouw.py`; dat maakt de zips in `dist/`.

Zie [LEESMIJ.txt](threads-activity-filter/LEESMIJ.txt) voor de volledige versiegeschiedenis.
