# Scorekeeper — Hartenjagen & klaverjassen

Mobiele web-app (PWA) om scores bij te houden tijdens hartenjagen en klaverjassen. Eén persoon houdt de score bij op z'n telefoon; geen login, geen backend — alles staat lokaal op het apparaat.

## Spelregels hartenjagen (huisregels, standaard)

Deze regels zijn bewust zo gekozen en moeten bij een volgende iteratie **niet** stilzwijgend veranderen:

### Kaarten en punten
- **32 kaarten** (7 en hoger), 4–6 spelers.
- **25 punten per ronde**: 8 harten × 1, schoppenvrouw 5, klaverenboer 2, ruiten tien 10.
- Een ronde-invoer moet optellen tot exact 25, anders wordt hij geweigerd.
- Er is ook een "Standaard (52 kaarten)"-variant (13 harten, Q♠ 5, J♣ 2, laatste slag 5 = 25). Puntwaardes, retourgrens en betaling zijn per spel instelbaar bij de setup.

### Pit (alles halen)
- De speler die alles haalt **kiest zelf**: −25 voor zichzelf óf +25 voor alle anderen.
- Pit-waardes werken **altijd direct op de score** en worden nooit omgekeerd door het retourspel.
- Een negatieve score door een pit vóór het retourspel is **geen** winst.

### Retourspel
- Zodra **één** speler bij de 100 is geweest, gaat **iedereen** retour: vanaf de volgende ronde telt elk gehaald punt voor alle spelers omlaag. Lage spelers hebben hier dus veel voordeel van.
- De speler die de 100 passeert houdt de overschrijding (90 + 17 → 107). De ronde waarin dat gebeurt telt zelf nog gewoon omhoog.
- **Winnen**: de eerste speler die tijdens het retourspel **onder de 0** komt (−1 of lager; precies 0 is nog geen winst).
- Een speler die al negatief staat (door een pit) op het moment dat het retourspel begint, wint **direct**.

### Gelijk uitmelden
- Komen er in dezelfde ronde **meerdere spelers onder de 0**, dan vraagt de app wie zich als eerste heeft uitgemeld. Die speler wint en krijgt de betaling — óók als een ander lager staat. "Laatste ronde ongedaan maken" wist deze keuze weer.

### Afrekening
- **Winner takes all**: iedere verliezer betaalt de winnaar **€0,50 (spel) + €0,05 per punt** van de eigen eindscore (negatieve score = alleen de €0,50).
- Onder de afrekening staat de opmerking dat dit **exclusief verrekening van eventuele pit-potjes** is; de app houdt pit-potjes zelf niet bij.

## Spelregels klaverjassen

Bij de setup kies je **Klaverjassen**: 2 teams ("Wij"/"Zij" standaard, namen aanpasbaar) en wie er als eerste deelt. Geen uitbetaalschema — de afrekening blijft bij klaverjassen verborgen.

### Twee tellingen
- **Volledig tot 1600**: ruwe scores, 162 kaartpunten + roem per potje. Eerste team op 1600 of hoger wint.
- **Afgerond tot 160**: je telt de kaarten gewoon tot 162, maar de score wordt afgerond op tientallen: 82 punten → 8, 97 → 10. **De eerste afronding krijgt voorrang**: het team waarvan je de punten intypt wordt afgerond, het andere team krijgt 16 min dat — een potje telt dus altijd op tot 16 (97–65 met 97 getypt → 10–6; met 65 getypt → 9–7). De "rest"-knop telt niet als invullen; zonder invoer (bijv. pit) geldt de troefmaker als geteld. Roem gaat er los overheen (20 → 2). Eerste team op 160 wint.
- Invoer is bij beide tellingen op de ruwe 162-schaal; de app rekent zelf om.
- Komen beide teams in hetzelfde potje over de grens, dan wint de hoogste; bij exact gelijke stand wordt doorgespeeld.

### Delen en nat gaan
- De app houdt bij **wie er deelt** (wisselt elk potje); bij invoer kies je welk team troef maakte (standaard het niet-delende team).
- **Nat**: het troefmakende team heeft inclusief roem **niet méér** punten dan de tegenstander (81–81 is dus ook nat). Dan gaan **alle punten plus alle roem** (en een eventuele pit-bonus) naar de tegenstander.

### Roem
- Roem kan **tijdens het potje** los worden bijgehouden (paneel met +20/+50/+100 per team op het spelscherm) en wordt bij het opslaan van het potje verrekend; het vooringevulde bedrag is in het invoerscherm nog aan te passen.

### Pit
- Een team dat alle slagen haalt krijgt alle punten **+100** (volledige telling) oftewel **+10** (afgeronde telling), bovenop de roem.

## Bediening / UI-keuzes

- UI-taal is **Nederlands**; alle teksten staan in `src/ui/strings.ts`.
- Spelscherm is een kolom met vaste hoogte: de **"Ronde invoeren"-knop blijft altijd in beeld**, alleen de scoretabel scrollt.
- Highlights op de standen: **groen + "laagste"** en **oranje + "hoogste"** (allen bij gelijke stand; niets zolang iedereen gelijk staat). De winnaar krijgt amber + 🏆.
- Banner "↓ Retourspel — punten tellen af" zodra het retourspel actief is.
- Punteninvoer: veld op 0 **leegt zichzelf bij focus**; een andere waarde wordt geselecteerd om direct te overschrijven; leeg veld telt als 0 en springt bij verlaten terug naar 0. Alleen cijfers, afgekapt op het rondetotaal.
- **Dark mode** volgt de systeeminstelling; het donkerrood (`red-700`) wordt in dark mode een lichter rood (`red-400` met donkere tekst) op `stone-950/800`-vlakken.

## Techniek

- **Vite + React + TypeScript + Tailwind CSS 4 + vite-plugin-pwa** (installeerbaar, offline). Geen backend, geen router-library.
- Opslag: `localStorage` onder de sleutel `scorekeeper.games.v1`; meerdere spellen naast elkaar (hervatten, historie, verwijderen).
- **Rondes zijn de bron van waarheid**: scores worden altijd herberekend door alle rondes opnieuw af te spelen (`computeState`; klaverjassen via `src/engine/klaverjas.ts`). Daardoor is undo triviaal — maar een regelwijziging herinterpreteert ook oude opgeslagen spellen.
- Structuur:
  - `src/engine/` — pure, volledig geteste spellogica (types, rules, scoring, validation, payment). Geen React.
  - `src/state/` — reducer + localStorage-persistentie (`gameStore.tsx`, `storage.ts`).
  - `src/pages/` + `src/components/` — Home, Setup, GameScreen, RoundEntry.
- Tests: **Vitest** (`npm test`) dekken de volledige regelset, inclusief randgevallen (precies 0, pit vóór retour, tie, overschrijding).

## Ontwikkelen & deployen

```bash
npm install
npm run dev     # dev-server op :5173
npm test        # engine- en store-tests
npm run build   # productie-build incl. service worker
```

Deploy: het GitHub-repo is aan Vercel gekoppeld — **elke commit op `main` deployt automatisch naar productie**. Push dus alleen naar `main` wat live mag.
